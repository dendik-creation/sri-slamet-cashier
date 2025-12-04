<?php

namespace App\Http\Controllers\global;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function adminReportView(Request $request)
    {
        // Default date range = current month
        $defaultStart = Carbon::now()->startOfMonth()->format("Y-m-d");
        $defaultEnd = Carbon::now()->endOfMonth()->format("Y-m-d");

        // Align filters with TransactionController (index): search, status, start_date_in, end_date_in, is_paid, cashier
        $raw = [
            "search" => $request->input("search"),
            "status" => $request->input("status"),
            "start_date_in" => $request->input("start_date_in", $defaultStart),
            "end_date_in" => $request->input("end_date_in", $defaultEnd),
            "is_paid" => $request->input("is_paid"), // 'true' | 'false' | null
            "cashier" => $request->input("cashier"),
        ];

        $rules = [
            "search" => "nullable|string",
            "status" => "nullable|string|in:IN_PROGRESS,COMPLETED,CLOSED",
            "start_date_in" => "required|date",
            "end_date_in" => "required|date|after_or_equal:start_date_in",
            "is_paid" => "nullable|in:true,false",
            "cashier" => "nullable|integer|exists:users,id",
        ];
        $validated = validator($raw, $rules)->validate();

        $filters = [
            "search" => $validated["search"] ?? null,
            "status" => $validated["status"] ?? null,
            "start_date_in" => $validated["start_date_in"],
            "end_date_in" => $validated["end_date_in"],
            "is_paid" => $validated["is_paid"] ?? null,
            "cashier" => $validated["cashier"] ?? null,
        ];

        $data = $this->buildReportData($filters);

        // Cashiers list for filter (role cashier only)
        $cashiers = \App\Models\User::where(
            "role",
            \App\Models\User::ROLE_CASHIER,
        )
            ->get()
            ->map(fn($u) => ["value" => $u->id, "label" => $u->name]);

        return Inertia::render("Admin/FinancialReport/Index", [
            "title" => "Laporan Keuangan",
            "description" => "Ringkasan keuangan periode terpilih",
            "filters" => $filters,
            "report" => $data,
            "cashiers" => $cashiers,
        ]);
    }

    public function adminReportGenerate(Request $request)
    {
        $validated = $request->validate([
            "search" => "nullable|string",
            "status" => "nullable|string|in:IN_PROGRESS,COMPLETED,CLOSED",
            "start_date_in" => "required|date",
            "end_date_in" => "required|date|after_or_equal:start_date_in",
            "is_paid" => "nullable|in:true,false",
            "cashier" => "nullable|integer|exists:users,id",
        ]);

        $filters = [
            "search" => $validated["search"] ?? null,
            "status" => $validated["status"] ?? null,
            "start_date_in" => $validated["start_date_in"],
            "end_date_in" => $validated["end_date_in"],
            "is_paid" => $validated["is_paid"] ?? null,
            "cashier" => $validated["cashier"] ?? null,
        ];

        $data = $this->buildPrintReportData($filters);

        return Inertia::render("Admin/FinancialReport/Print", [
            "title" => "Cetak Laporan Keuangan",
            "description" =>
                "Detail laporan keuangan berdasarkan periode ditentukan",
            "filters" => $filters,
            "report" => $data,
        ]);
    }

    protected function buildReportData(array $filters)
    {
        $start = Carbon::parse($filters["start_date_in"])->startOfDay();
        $end = Carbon::parse($filters["end_date_in"])->endOfDay();

        // Base queries with filters
        $trxQuery = Transaction::with("customer", "cashier")->whereBetween(
            "order_at",
            [$start, $end],
        );
        $payQuery = Payment::query()->whereBetween("paid_at", [$start, $end]);
        $itemQuery = TransactionItem::query()->whereHas(
            "transaction",
            fn($q) => $q->whereBetween("order_at", [$start, $end]),
        );

        if ($filters["status"]) {
            $trxQuery->where("status", $filters["status"]);
        }
        if ($filters["is_paid"]) {
            $trxQuery->where(
                "is_paid",
                filter_var($filters["is_paid"], FILTER_VALIDATE_BOOLEAN),
            );
        }
        if ($filters["cashier"]) {
            $trxQuery->where("cashier_id", $filters["cashier"]);
        }
        if ($filters["search"]) {
            $search = $filters["search"];
            $trxQuery->where(function ($q) use ($search) {
                $q->where(
                    "invoice_code",
                    "like",
                    "%" . $search . "%",
                )->orWhereHas(
                    "customer",
                    fn($qc) => $qc->where("name", "like", "%" . $search . "%"),
                );
            });
        }

        $transactions = $trxQuery->get([
            "id",
            "invoice_code",
            "customer_id",
            "cashier_id",
            "status",
            "subtotal",
            "tax_ppn",
            "total",
            "is_paid",
            "order_at",
            "completed_at",
        ]);
        $payments = $payQuery->get([
            "id",
            "transaction_id",
            "recorded_by",
            "amount",
            "method",
            "paid_at",
        ]);
        $refundedItems = $itemQuery
            ->where("status", TransactionItem::STATUS_REFUNDED)
            ->get(["id", "transaction_id", "line_total"]);

        $totalRevenue = (int) $payments->sum("amount");
        $totalTransactions = $transactions->count();
        $averageTransactionValue = $totalTransactions
            ? (int) floor($transactions->avg("total"))
            : 0;
        $totalOutstanding = (int) $transactions
            ->where("is_paid", false)
            ->sum("total");
        $totalRefundedAmount = (int) $refundedItems->sum("line_total");
        $refundedItemsCount = $refundedItems->count();

        // Payment method breakdown (amount & counts)
        $paymentMethodBreakdown = $payments
            ->groupBy("method")
            ->map(fn($c) => (int) $c->sum("amount"));
        $paymentMethodCounts = $payments
            ->groupBy("method")
            ->map(fn($c) => $c->count());
        // Status distribution (counts) + status amounts (sum total)
        $statusDistribution = $transactions
            ->groupBy("status")
            ->map(fn($c) => $c->count());
        $statusAmountDistribution = $transactions
            ->groupBy("status")
            ->map(fn($c) => (int) $c->sum("total"));

        // Daily revenue series
        // Expand the date range by 1 day on each side to handle same start/end dates
        $expandedStart = Carbon::parse($start)->subDay();
        $expandedEnd = Carbon::parse($end)->addDay();
        $periodDays = $expandedStart->diffInDays($expandedEnd) + 1;

        $daily = collect(range(0, $periodDays - 1))->map(function ($i) use (
            $expandedStart,
            $payments,
        ) {
            $day = (clone $expandedStart)->addDays($i);
            $amount = (int) $payments
                ->filter(fn($p) => Carbon::parse($p->paid_at)->isSameDay($day))
                ->sum("amount");
            return [
                "date" => $day->format("Y-m-d"),
                "amount" => $amount,
            ];
        });

        $dailyTransactions = collect(range(0, $periodDays - 1))->map(function (
            $i,
        ) use ($start, $transactions) {
            $day = (clone $start)->addDays($i);
            $count = $transactions
                ->filter(fn($t) => Carbon::parse($t->order_at)->isSameDay($day))
                ->count();
            return [
                "date" => $day->format("Y-m-d"),
                "count" => $count,
            ];
        });

        // Top customers by paid amount
        $topCustomers = Payment::query()
            ->join("transactions as t", "payments.transaction_id", "=", "t.id")
            ->join("customers as c", "t.customer_id", "=", "c.id")
            ->whereBetween("payments.paid_at", [$start, $end])
            ->select(
                "t.customer_id",
                "c.name",
                DB::raw("SUM(payments.amount) as total"),
            )
            ->groupBy("t.customer_id", "c.name")
            ->orderByDesc("total")
            ->limit(10)
            ->get()
            ->map(
                fn($row) => [
                    "customer" => [
                        "id" => $row->customer_id,
                        "name" => $row->name,
                    ],
                    "total" => (int) $row->total,
                ],
            );

        // Top cashiers by recorded payments
        $topCashiers = Payment::query()
            ->join("users as u", "payments.recorded_by", "=", "u.id")
            ->whereBetween("payments.paid_at", [$start, $end])
            ->select(
                "payments.recorded_by",
                "u.name",
                DB::raw("SUM(payments.amount) as total"),
            )
            ->groupBy("payments.recorded_by", "u.name")
            ->orderByDesc("total")
            ->limit(10)
            ->get()
            ->map(
                fn($row) => [
                    "user" => ["id" => $row->recorded_by, "name" => $row->name],
                    "total" => (int) $row->total,
                ],
            );

        return [
            "summary" => [
                "total_revenue" => $totalRevenue,
                "total_transactions" => $totalTransactions,
                "average_transaction" => $averageTransactionValue,
                "total_outstanding" => $totalOutstanding,
                "total_refunded" => $totalRefundedAmount,
                "refunded_items_count" => $refundedItemsCount,
                "period_days" => $periodDays,
            ],
            "breakdown" => [
                "payment_method" => $paymentMethodBreakdown,
                "payment_method_counts" => $paymentMethodCounts,
                "status_distribution" => $statusDistribution,
                "status_amount_distribution" => $statusAmountDistribution,
            ],
            "charts" => [
                "daily_revenue" => [
                    "labels" => $daily->pluck("date"),
                    "series" => $daily->pluck("amount"),
                ],
                "daily_transactions" => [
                    "labels" => $dailyTransactions->pluck("date"),
                    "series" => $dailyTransactions->pluck("count"),
                ],
            ],
            "tables" => [
                "top_customers" => $topCustomers,
                "top_cashiers" => $topCashiers,
                // Keep index transactions limited for performance (10)
                "transactions" => $transactions->take(10)->map(
                    fn($t) => [
                        "id" => $t->id,
                        "invoice_code" => $t->invoice_code,
                        "status" => $t->status,
                        "total" => (int) $t->total,
                        "is_paid" => (bool) $t->is_paid,
                        "cashier" => [
                            "id" => $t->cashier?->id,
                            "name" => $t->cashier?->name,
                        ],
                        "customer" => [
                            "id" => $t->customer?->id,
                            "name" => $t->customer?->name,
                        ],
                        "order_at" => $t->order_at,
                        "completed_at" => $t->completed_at,
                    ],
                ),
            ],
        ];
    }

    // Full dataset for print (all transactions in period, maintain other aggregations)
    protected function buildPrintReportData(array $filters)
    {
        $start = Carbon::parse($filters["start_date_in"])->startOfDay();
        $end = Carbon::parse($filters["end_date_in"])->endOfDay();

        $trxQuery = Transaction::with("customer", "cashier")->whereBetween(
            "order_at",
            [$start, $end],
        );
        $payQuery = Payment::query()->whereBetween("paid_at", [$start, $end]);
        $itemQuery = TransactionItem::query()->whereHas(
            "transaction",
            fn($q) => $q->whereBetween("order_at", [$start, $end]),
        );

        if ($filters["status"]) {
            $trxQuery->where("status", $filters["status"]);
        }
        if ($filters["is_paid"]) {
            $trxQuery->where(
                "is_paid",
                filter_var($filters["is_paid"], FILTER_VALIDATE_BOOLEAN),
            );
        }
        if ($filters["cashier"]) {
            $trxQuery->where("cashier_id", $filters["cashier"]);
        }
        if ($filters["search"]) {
            $search = $filters["search"];
            $trxQuery->where(function ($q) use ($search) {
                $q->where(
                    "invoice_code",
                    "like",
                    "%" . $search . "%",
                )->orWhereHas(
                    "customer",
                    fn($qc) => $qc->where("name", "like", "%" . $search . "%"),
                );
            });
        }

        $transactions = $trxQuery->get([
            "id",
            "invoice_code",
            "cashier_id",
            "customer_id",
            "status",
            "total",
            "is_paid",
            "order_at",
            "completed_at",
        ]);
        $payments = $payQuery->get(["amount", "method", "paid_at"]);
        $refundedItems = $itemQuery
            ->where("status", TransactionItem::STATUS_REFUNDED)
            ->get(["line_total"]);

        $totalRevenue = (int) $payments->sum("amount");
        $totalTransactions = $transactions->count();
        $averageTransactionValue = $totalTransactions
            ? (int) floor($transactions->avg("total"))
            : 0;
        $totalOutstanding = (int) $transactions
            ->where("is_paid", false)
            ->sum("total");
        $totalRefundedAmount = (int) $refundedItems->sum("line_total");
        $refundedItemsCount = $refundedItems->count();

        $paymentMethodBreakdown = $payments
            ->groupBy("method")
            ->map(fn($c) => (int) $c->sum("amount"));
        $paymentMethodCounts = $payments
            ->groupBy("method")
            ->map(fn($c) => $c->count());
        $statusDistribution = $transactions
            ->groupBy("status")
            ->map(fn($c) => $c->count());
        $statusAmountDistribution = $transactions
            ->groupBy("status")
            ->map(fn($c) => (int) $c->sum("total"));

        $periodDays = Carbon::parse($start)->diffInDays($end) + 1;
        $daily = collect(range(0, $periodDays - 1))->map(function ($i) use (
            $start,
            $payments,
        ) {
            $day = (clone $start)->addDays($i);
            $amount = (int) $payments
                ->filter(fn($p) => Carbon::parse($p->paid_at)->isSameDay($day))
                ->sum("amount");
            return ["date" => $day->format("Y-m-d"), "amount" => $amount];
        });
        $dailyTransactions = collect(range(0, $periodDays - 1))->map(function (
            $i,
        ) use ($start, $transactions) {
            $day = (clone $start)->addDays($i);
            $count = $transactions
                ->filter(fn($t) => Carbon::parse($t->order_at)->isSameDay($day))
                ->count();
            return ["date" => $day->format("Y-m-d"), "count" => $count];
        });

        return [
            "summary" => [
                "total_revenue" => $totalRevenue,
                "total_transactions" => $totalTransactions,
                "average_transaction" => $averageTransactionValue,
                "total_outstanding" => $totalOutstanding,
                "total_refunded" => $totalRefundedAmount,
                "refunded_items_count" => $refundedItemsCount,
                "period_days" => $periodDays,
            ],
            "breakdown" => [
                "payment_method" => $paymentMethodBreakdown,
                "payment_method_counts" => $paymentMethodCounts,
                "status_distribution" => $statusDistribution,
                "status_amount_distribution" => $statusAmountDistribution,
            ],
            "charts" => [
                "daily_revenue" => [
                    "labels" => $daily->pluck("date"),
                    "series" => $daily->pluck("amount"),
                ],
                "daily_transactions" => [
                    "labels" => $dailyTransactions->pluck("date"),
                    "series" => $dailyTransactions->pluck("count"),
                ],
            ],
            "tables" => [
                "top_customers" => [], // Not needed for print improvement per request
                "top_cashiers" => [],
                "transactions" => $transactions->map(
                    fn($t) => [
                        "id" => $t->id,
                        "invoice_code" => $t->invoice_code,
                        "status" => $t->status,
                        "total" => (int) $t->total,
                        "is_paid" => (bool) $t->is_paid,
                        "cashier" => [
                            "id" => $t->cashier?->id,
                            "name" => $t->cashier?->name,
                        ],
                        "customer" => [
                            "id" => $t->customer?->id,
                            "name" => $t->customer?->name,
                        ],
                        "order_at" => $t->order_at,
                        "completed_at" => $t->completed_at,
                    ],
                ),
            ],
        ];
    }

    // Minimal dataset for index page (lighter & faster)
    protected function buildMinimalReportData(array $filters)
    {
        $start = Carbon::parse($filters["start_date"])->startOfDay();
        $end = Carbon::parse($filters["end_date"])->endOfDay();

        $trxQuery = Transaction::with("cashier", "customer")->whereBetween(
            "order_at",
            [$start, $end],
        );
        $payQuery = Payment::query()->whereBetween("paid_at", [$start, $end]);
        $itemQuery = TransactionItem::query()->whereHas(
            "transaction",
            fn($q) => $q->whereBetween("order_at", [$start, $end]),
        );

        if ($filters["status"]) {
            $trxQuery->where("status", $filters["status"]);
        }
        if ($filters["payment_method"]) {
            $payQuery->where("method", $filters["payment_method"]);
        }

        $transactions = $trxQuery->get([
            "id",
            "invoice_code",
            "status",
            "total",
            "is_paid",
            "order_at",
            "completed_at",
        ]);
        $payments = $payQuery->get(["amount", "paid_at"]);
        $refundedItems = $itemQuery
            ->where("status", TransactionItem::STATUS_REFUNDED)
            ->get(["line_total"]);

        $totalRevenue = (int) $payments->sum("amount");
        $totalTransactions = $transactions->count();
        $totalOutstanding = (int) $transactions
            ->where("is_paid", false)
            ->sum("total");
        $totalRefundedAmount = (int) $refundedItems->sum("line_total");
        $periodDays = Carbon::parse($start)->diffInDays($end) + 1;

        $daily = collect(range(0, $periodDays - 1))->map(function ($i) use (
            $start,
            $payments,
        ) {
            $day = (clone $start)->addDays($i);
            $amount = (int) $payments
                ->filter(fn($p) => Carbon::parse($p->paid_at)->isSameDay($day))
                ->sum("amount");
            return ["date" => $day->format("Y-m-d"), "amount" => $amount];
        });

        return [
            "summary" => [
                "total_revenue" => $totalRevenue,
                "total_transactions" => $totalTransactions,
                "total_outstanding" => $totalOutstanding,
                "total_refunded" => $totalRefundedAmount,
                "period_days" => $periodDays,
            ],
            "charts" => [
                "daily_revenue" => [
                    "labels" => $daily->pluck("date"),
                    "series" => $daily->pluck("amount"),
                ],
            ],
            "tables" => [
                "transactions" => $transactions->take(50)->map(
                    fn($t) => [
                        "id" => $t->id,
                        "invoice_code" => $t->invoice_code,
                        "status" => $t->status,
                        "total" => (int) $t->total,
                        "is_paid" => (bool) $t->is_paid,
                        "order_at" => $t->order_at,
                        "completed_at" => $t->completed_at,
                        "cashier" => $t->cashier,
                        "customer" => $t->customer,
                    ],
                ),
            ],
        ];
    }
}
