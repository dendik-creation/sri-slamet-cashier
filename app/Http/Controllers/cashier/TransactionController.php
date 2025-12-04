<?php

namespace App\Http\Controllers\cashier;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class TransactionController extends Controller
{
    private function roundingToNearestHundred($value)
    {
        $tens = $value % 100;
        if ($tens === 0) {
            return $value;
        }
        if ($tens < 50) {
            return $value - $tens;
        } else {
            return $value + (100 - $tens);
        }
    }

    public function index(Request $request)
    {
        $by_search = $request->input("search", null);
        $by_status = $request->input("status", null);
        $by_start_date_in = $request->input("start_date_in", null);
        $by_end_date_in = $request->input("end_date_in", null);
        $by_is_paid = $request->input("is_paid", null);

        $transactions = Transaction::with("customer", "cashier", "items")
            ->when($by_search, function ($query, $by_search) {
                $query->where(function ($q) use ($by_search) {
                    $q->where(
                        "invoice_code",
                        "like",
                        "%" . $by_search . "%",
                    )->orWhereHas("customer", function ($q2) use ($by_search) {
                        $q2->where("name", "like", "%" . $by_search . "%");
                    });
                });
            })
            ->when($by_status, function ($query, $by_status) {
                $query->where("status", $by_status);
            })
            ->when($by_start_date_in && $by_end_date_in, function ($query) use (
                $by_start_date_in,
                $by_end_date_in,
            ) {
                $query->whereBetween("order_at", [
                    $by_start_date_in,
                    $by_end_date_in,
                ]);
            })
            ->when($by_is_paid, function ($query, $by_is_paid) {
                if ($by_is_paid !== null) {
                    $query->where(
                        "is_paid",
                        filter_var($by_is_paid, FILTER_VALIDATE_BOOLEAN),
                    );
                }
            })
            ->orderBy("order_at", "DESC")
            ->paginate(config("custom.pagination_size"));

        return Inertia::render("Cashier/Transaction/Index", [
            "title" => "Daftar Transaksi",
            "description" => "Kelola daftar transaksi jasa perbaikan",
            "transactions" => $transactions,
            "by_search" => $by_search,
            "by_status" => $by_status,
            "by_start_date_in" => $by_start_date_in,
            "by_end_date_in" => $by_end_date_in,
        ]);
    }

    public function create()
    {
        $app_setting = AppSetting::getSetting();
        $customers = Customer::select("id", "name", "phone", "address")
            ->get()
            ->map(function ($customer) {
                return [
                    "label" => $customer->name,
                    "value" => $customer->id,
                    "additional_info" => [
                        "phone" => $customer->phone,
                        "address" => $customer->address,
                    ],
                ];
            });
        return Inertia::render("Cashier/Transaction/New", [
            "title" => "Transaksi Baru",
            "description" => "Buat transaksi jasa perbaikan baru",
            "customers" => $customers,
            "app_setting" => $app_setting,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "is_new_customer" => "required|boolean",
            "trx.invoice_code" => "required|unique:transactions,invoice_code",
            "trx.customer_id" => [
                $request->input("is_new_customer") ? "nullable" : "required",
                "exists:customers,id",
            ],
            "trx.customer_name" => "required|string",
            "trx.customer_phone" => "required|string",
            "trx.customer_address" => "required|string",
            "trx.order_at" => "required",
            "trx.trx_items" => "required|array|min:1",
            "trx.trx_items.*.description" => "required|string",
            "trx.trx_items.*.line_total" => "required|numeric",
            "trx.subtotal" => "required|numeric",
            "trx.tax_ppn" => "required|numeric",
            "trx.total" => "required|numeric",
            "trx.payment.method" => "nullable|string",
            "trx.payment.amount" => "nullable|numeric",
        ]);

        $auth = Auth::user();
        $transaction = [
            "customer_id" => null,
            "cashier_id" => $auth->id,
            "invoice_code" => $validated["trx"]["invoice_code"],
            "status" => Transaction::STATUS_IN_PROGRESS,
            "subtotal" => $validated["trx"]["subtotal"],
            "tax_ppn" => $validated["trx"]["tax_ppn"],
            "order_at" => $validated["trx"]["order_at"],
            "total" => $this->roundingToNearestHundred(
                $validated["trx"]["total"],
            ),
            "is_paid" => false,
        ];
        $transaction_items = [];

        // Save Customer
        if ($validated["is_new_customer"]) {
            $new_cust = Customer::create([
                "name" => $validated["trx"]["customer_name"],
                "phone" => $validated["trx"]["customer_phone"],
                "address" => $validated["trx"]["customer_address"],
            ]);
            $transaction["customer_id"] = $new_cust["id"];
        } else {
            $transaction["customer_id"] = $validated["trx"]["customer_id"];
        }

        // is paid ?
        if (
            isset($validated["trx"]["payment"]["amount"]) &&
            $validated["trx"]["payment"]["amount"] >= $transaction["total"]
        ) {
            $transaction["is_paid"] = true;
        }

        // Insert Trx
        $inserted_trx = Transaction::create($transaction);

        // Fill Trx Items
        foreach ($validated["trx"]["trx_items"] as $item) {
            $transaction_items[] = [
                "transaction_id" => $inserted_trx->id,
                "description" => $item["description"],
                "line_total" => $item["line_total"],
                "created_at" => now(),
                "updated_at" => now(),
            ];
        }

        // Insert Trx Items
        DB::table("transaction_items")->insert($transaction_items);

        // Is paid, insert payment
        if ($transaction["is_paid"]) {
            DB::table("payments")->insert([
                "transaction_id" => $inserted_trx->id,
                "recorded_by" => $auth->id,
                "method" => $validated["trx"]["payment"]["method"],
                "amount" =>
                    $validated["trx"]["payment"]["amount"] ??
                    $transaction["total"],
                "paid_at" => now(),
                "created_at" => now(),
                "updated_at" => now(),
            ]);
        }

        Session::flash("success", "Transaksi berhasil disimpan");
        return Inertia::location(route("cashier.transactions.index"));
    }

    public function show($id)
    {
        $transaction = Transaction::with(
            "customer",
            "cashier",
            "items",
            "payment.recorder",
        )
            ->where("id", $id)
            ->firstOrFail();

        return Inertia::render("Cashier/Transaction/Show", [
            "title" => "Detail Transaksi",
            "description" => "Lihat detail transaksi jasa perbaikan",
            "transaction" => $transaction,
        ]);
    }

    public function edit($id)
    {
        $transaction = Transaction::with(
            "customer",
            "cashier",
            "items",
            "payment.recorder",
        )
            ->where("id", $id)
            ->firstOrFail();
        $app_setting = AppSetting::getSetting();
        $customers = Customer::select("id", "name", "phone", "address")
            ->get()
            ->map(function ($customer) {
                return [
                    "label" => $customer->name,
                    "value" => $customer->id,
                    "additional_info" => [
                        "phone" => $customer->phone,
                        "address" => $customer->address,
                    ],
                ];
            });

        return Inertia::render("Cashier/Transaction/Edit", [
            "title" => "Edit Transaksi",
            "description" => "Edit transaksi jasa perbaikan",
            "transaction" => $transaction,
            "customers" => $customers,
            "app_setting" => $app_setting,
        ]);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::with(["items", "payment"])
            ->where("id", $id)
            ->firstOrFail();

        $validated = $request->validate(
            [
                "trx.invoice_code" =>
                    "required|unique:transactions,invoice_code," .
                    $transaction->id,
                "trx.customer_id" => ["required", "exists:customers,id"],
                "trx.customer_name" => "required|string",
                "trx.customer_phone" => "required|string",
                "trx.customer_address" => "required|string",
                "trx.order_at" => "required",
                "trx.completed_at" => "nullable",
                "trx.status" => "required|in:IN_PROGRESS,COMPLETED,CLOSED",
                "trx.trx_items" => "nullable|array",
                "trx.trx_items.*.description" => "nullable|string",
                "trx.trx_items.*.line_total" => "nullable|numeric",
                "trx.trx_items.*.status" =>
                    "nullable|in:ACTIVE,REFUNDED,REPLACED,COMPLETED",
                "trx.trx_items.*.refund_reason" => "nullable|string",
                "trx.subtotal" => "required|numeric",
                "trx.tax_ppn" => "required|numeric",
                "trx.total" => "required|numeric",
                "trx.payment.method" => "nullable|string",
                "trx.payment.amount" => "nullable|numeric",
            ],
            [
                "trx.invoice_code.unique" =>
                    "Kode transaksi sudah digunakan pada transaksi lain",
            ],
        );

        $auth = Auth::user();

        // Manual refund_reason validation for refunded items
        foreach ($validated["trx"]["trx_items"] as $idx => $item) {
            if ($item["status"] === TransactionItem::STATUS_REFUNDED) {
                if (
                    !array_key_exists("refund_reason", $item) ||
                    $item["refund_reason"] === null ||
                    trim($item["refund_reason"]) === ""
                ) {
                    return back()
                        ->withErrors([
                            "trx.trx_items.$idx.refund_reason" => "Alasan wajib diisi untuk item yang direfund",
                        ])
                        ->withInput();
                }
            }
        }

        DB::beginTransaction();
        try {
            // Customer always existing now; assign and optionally sync basic info
            $transaction->customer_id = $validated["trx"]["customer_id"];
            if ($transaction->customer_id) {
                Customer::where("id", $transaction->customer_id)->update([
                    "name" => $validated["trx"]["customer_name"],
                    "phone" => $validated["trx"]["customer_phone"],
                    "address" => $validated["trx"]["customer_address"],
                ]);
            }

            // Update main transaction fields
            $transaction->invoice_code = $validated["trx"]["invoice_code"];
            $transaction->order_at = $validated["trx"]["order_at"];
            $transaction->tax_ppn = $validated["trx"]["tax_ppn"];
            $prevStatus = $transaction->status;
            $transaction->status = $validated["trx"]["status"];

            // completed_at logic
            if (!empty($validated["trx"]["completed_at"])) {
                $transaction->completed_at = $validated["trx"]["completed_at"];
            } elseif (
                $prevStatus !== "COMPLETED" &&
                $transaction->status === "COMPLETED" &&
                !$transaction->completed_at
            ) {
                $transaction->completed_at = now();
            }

            // Handle items
            $submittedItems = $validated["trx"]["trx_items"];
            $existingItemsById = $transaction->items->keyBy("id");
            $submittedIds = collect($submittedItems)
                ->filter(fn($i) => array_key_exists("id", $i) && $i["id"])
                ->pluck("id")
                ->all();

            // Soft delete items not submitted anymore
            $transaction->items
                ->filter(fn($itm) => !in_array($itm->id, $submittedIds))
                ->each(function ($itm) {
                    $itm->delete();
                });

            $recalculatedSubtotal = 0;
            $allRefunded = true;
            foreach ($submittedItems as $itemData) {
                $itemId = $itemData["id"] ?? null;
                $status = $itemData["status"];
                $lineTotal = (int) $itemData["line_total"];
                $description = $itemData["description"];
                $refundReason = $itemData["refund_reason"] ?? null;

                if ($itemId && $existingItemsById->has($itemId)) {
                    $itemModel = $existingItemsById[$itemId];
                    $previousStatus = $itemModel->status;
                    $itemModel->description = $description;
                    $itemModel->line_total = $lineTotal;
                    $itemModel->status = $status;
                    if ($status === TransactionItem::STATUS_REFUNDED) {
                        $itemModel->refund_reason = $refundReason;
                    } elseif (
                        $previousStatus === TransactionItem::STATUS_REFUNDED &&
                        $status !== TransactionItem::STATUS_REFUNDED
                    ) {
                        $itemModel->refund_reason = null;
                    }
                    $itemModel->save();
                } else {
                    DB::table("transaction_items")->insertGetId([
                        "transaction_id" => $transaction->id,
                        "description" => $description,
                        "line_total" => $lineTotal,
                        "status" => $status,
                        "refund_reason" =>
                            $status === TransactionItem::STATUS_REFUNDED
                                ? $refundReason
                                : null,
                        "created_at" => now(),
                        "updated_at" => now(),
                    ]);
                }

                // Only count non-refunded items toward subtotal
                if ($status !== TransactionItem::STATUS_REFUNDED) {
                    $recalculatedSubtotal += $lineTotal;
                    $allRefunded = false;
                }
            }

            // Recalculate totals based on non-refunded items
            $transaction->subtotal = $recalculatedSubtotal;
            $transaction->total = $this->roundingToNearestHundred(
                $recalculatedSubtotal +
                    $recalculatedSubtotal * ($transaction->tax_ppn / 100),
            );

            // Handle payment (paid or not)
            $totalPaid = 0;
            if (!empty($validated["trx"]["payment"]["method"])) {
                $method = $validated["trx"]["payment"]["method"];
                $amount = (int) $transaction->total;

                // Upsert payment
                $existingPayment = $transaction->payment;
                if ($existingPayment) {
                    DB::table("payments")
                        ->where("id", $existingPayment->id)
                        ->update([
                            "recorded_by" => $auth->id,
                            "method" => $method,
                            "amount" => $amount,
                            "paid_at" => now(),
                            "updated_at" => now(),
                        ]);
                } else {
                    DB::table("payments")->insert([
                        "transaction_id" => $transaction->id,
                        "recorded_by" => $auth->id,
                        "method" => $method,
                        "amount" => $amount,
                        "paid_at" => now(),
                        "created_at" => now(),
                        "updated_at" => now(),
                    ]);
                }
                $totalPaid = $amount;
            } else {
                // No payment: delete if exists
                if ($transaction->payment) {
                    $transaction->payment->delete();
                }
                $totalPaid = 0;
            }
            $transaction->is_paid = $totalPaid >= $transaction->total;

            // Otomatis status transaksi jika semua item REFUNDED
            if ($allRefunded) {
                $transaction->status = Transaction::STATUS_CLOSED;
            } elseif ($transaction->is_paid) {
                // Jika sudah lunas (amount_due <= 0) maka tandai semua item ACTIVE menjadi COMPLETED
                $transaction
                    ->items()
                    ->where("status", TransactionItem::STATUS_ACTIVE)
                    ->update(["status" => TransactionItem::STATUS_COMPLETED]);
                $transaction->status = Transaction::STATUS_COMPLETED;
                if (!$transaction->completed_at) {
                    $transaction->completed_at = now();
                }
            }

            $transaction->save();

            DB::commit();
            Session::flash("success", "Transaksi berhasil diperbarui");
            return Inertia::location(
                route("cashier.transactions.show", ["id" => $transaction->id]),
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()
                ->withErrors(["error" => "Gagal memperbarui transaksi"])
                ->withInput();
        }
    }

    public function destroy($id)
    {
        $transaction = Transaction::where("id", $id)->firstOrFail();
        $transaction->delete();

        Session::flash("success", "Transaksi berhasil dihapus");
        return Inertia::location(route("cashier.transactions.index"));
    }
}
