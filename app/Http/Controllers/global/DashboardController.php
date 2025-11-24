<?php

namespace App\Http\Controllers\global;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function adminDashboard(){
        $today = Carbon::today();
        $startMonth = Carbon::now()->startOfMonth();
        $endMonth = Carbon::now()->endOfMonth();

        $revenueToday = Payment::whereDate('paid_at', $today)->sum('amount');
        $revenueMonth = Payment::whereBetween('paid_at', [$startMonth, $endMonth])->sum('amount');
        $outstanding = Transaction::where('amount_due', '>', 0)->sum('amount_due');
        $trxToday = Transaction::whereDate('order_at', $today)->count();
        $completedToday = Transaction::whereDate('completed_at', $today)->count();

        // Revenue last 7 days
        $days = collect(range(6, 0))->map(fn($i) => Carbon::today()->subDays($i));
        $rev7 = $days->map(function ($d) {
            return Payment::whereDate('paid_at', $d)->sum('amount');
        })->values();
        $rev7Labels = $days->map(fn($d) => $d->format('Y-m-d'))->values();

        // Payment method breakdown this month
        $methodRaw = Payment::select('method', DB::raw('SUM(amount) as total'))
            ->whereBetween('paid_at', [$startMonth, $endMonth])
            ->groupBy('method')
            ->pluck('total', 'method');
        $methodLabels = array_values($methodRaw->keys()->all());
        $methodSeries = array_values($methodRaw->values()->all());

        // Status distribution
        $statusRaw = Transaction::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $statusLabels = array_values($statusRaw->keys()->all());
        $statusSeries = array_values($statusRaw->values()->all());

        // Top cashiers by revenue (payments recorder) this month
        $topCashiers = Payment::select('recorded_by', DB::raw('SUM(amount) as total'))
            ->whereBetween('paid_at', [$startMonth, $endMonth])
            ->groupBy('recorded_by')
            ->orderByDesc('total')
            ->with('recorder:id,name')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'user' => $p->recorder ? ['id' => $p->recorder->id, 'name' => $p->recorder->name] : null,
                'total' => (int) $p->total,
            ]);

        // Top customers by paid amount this month
        $topCustomers = Payment::query()
            ->join('transactions as t', 'payments.transaction_id', '=', 't.id')
            ->join('customers as c', 't.customer_id', '=', 'c.id')
            ->whereBetween('payments.paid_at', [$startMonth, $endMonth])
            ->groupBy('t.customer_id', 'c.name', 'c.phone')
            ->select('t.customer_id', 'c.name', 'c.phone', DB::raw('SUM(payments.amount) as total'))
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn($row) => [
                'customer' => ['id' => $row->customer_id, 'name' => $row->name, 'phone' => $row->phone],
                'total' => (int) $row->total,
            ]);

        // Recent transactions
        $recentTrx = Transaction::with(['customer:id,name', 'cashier:id,name'])
            ->orderByDesc('order_at')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'invoice_code' => $t->invoice_code,
                'customer' => $t->customer ? ['id' => $t->customer->id, 'name' => $t->customer->name] : null,
                'cashier' => $t->cashier ? ['id' => $t->cashier->id, 'name' => $t->cashier->name] : null,
                'status' => $t->status,
                'total' => (int) $t->total,
                'amount_due' => (int) $t->amount_due,
                'order_at' => $t->order_at,
                'completed_at' => $t->completed_at,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'title' => "Dashboard",
            'description' => "Halaman utama untuk melihat ringkasan data kasir",
            'kpis' => [
                'revenue_today' => (int) $revenueToday,
                'revenue_month' => (int) $revenueMonth,
                'outstanding' => (int) $outstanding,
                'trx_today' => (int) $trxToday,
                'completed_today' => (int) $completedToday,
            ],
            'charts' => [
                'revenue7' => [
                    'labels' => $rev7Labels,
                    'series' => $rev7,
                ],
                'paymentMethodMonth' => [
                    'labels' => $methodLabels,
                    'series' => $methodSeries,
                ],
                'statusDistribution' => [
                    'labels' => $statusLabels,
                    'series' => $statusSeries,
                ],
            ],
            'tables' => [
                'recentTransactions' => $recentTrx,
                'topCashiers' => $topCashiers,
                'topCustomers' => $topCustomers,
            ],
        ]);
    }
    
    public function cashierDashboard(Request $request){
        $user = $request->user();
        $today = Carbon::today();
        $startMonth = Carbon::now()->startOfMonth();
        $endMonth = Carbon::now()->endOfMonth();

        // KPIs for this cashier
        $myRevenueToday = Payment::where('recorded_by', $user->id)
            ->whereDate('paid_at', $today)->sum('amount');
        $myRevenueMonth = Payment::where('recorded_by', $user->id)
            ->whereBetween('paid_at', [$startMonth, $endMonth])->sum('amount');
        $myTrxToday = Transaction::where('cashier_id', $user->id)
            ->whereDate('order_at', $today)->count();
        $myOutstanding = Transaction::where('cashier_id', $user->id)
            ->where('amount_due', '>', 0)->sum('amount_due');

        // My revenue last 7 days
        $days = collect(range(6, 0))->map(fn($i) => Carbon::today()->subDays($i));
        $myRev7 = $days->map(function ($d) use ($user) {
            return Payment::where('recorded_by', $user->id)->whereDate('paid_at', $d)->sum('amount');
        })->values();
        $rev7Labels = $days->map(fn($d) => $d->format('Y-m-d'))->values();

        // My payment method breakdown this month
        $methodRaw = Payment::select('method', DB::raw('SUM(amount) as total'))
            ->where('recorded_by', $user->id)
            ->whereBetween('paid_at', [$startMonth, $endMonth])
            ->groupBy('method')
            ->pluck('total', 'method');
        $methodLabels = array_values($methodRaw->keys()->all());
        $methodSeries = array_values($methodRaw->values()->all());

        // My recent transactions
        $recentTrx = Transaction::with(['customer:id,name'])
            ->where('cashier_id', $user->id)
            ->orderByDesc('order_at')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'invoice_code' => $t->invoice_code,
                'customer' => $t->customer ? ['id' => $t->customer->id, 'name' => $t->customer->name] : null,
                'status' => $t->status,
                'total' => (int) $t->total,
                'amount_due' => (int) $t->amount_due,
                'order_at' => $t->order_at,
                'completed_at' => $t->completed_at,
            ]);

        // My recent payments
        $recentPayments = Payment::with(['transaction:id,invoice_code'])
            ->where('recorded_by', $user->id)
            ->orderByDesc('paid_at')
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'transaction' => $p->transaction ? ['id' => $p->transaction->id, 'invoice_code' => $p->transaction->invoice_code] : null,
                'amount' => (int) $p->amount,
                'method' => $p->method,
                'paid_at' => $p->paid_at,
            ]);

        return Inertia::render('Cashier/Dashboard', [
            'title' => "Dashboard",
            'description' => "Halaman utama untuk melihat ringkasan data kasir",
            'kpis' => [
                'revenue_today' => (int) $myRevenueToday,
                'revenue_month' => (int) $myRevenueMonth,
                'trx_today' => (int) $myTrxToday,
                'outstanding' => (int) $myOutstanding,
            ],
            'charts' => [
                'revenue7' => [
                    'labels' => $rev7Labels,
                    'series' => $myRev7,
                ],
                'paymentMethodMonth' => [
                    'labels' => $methodLabels,
                    'series' => $methodSeries,
                ],
            ],
            'tables' => [
                'recentTransactions' => $recentTrx,
                'recentPayments' => $recentPayments,
            ],
        ]);
    }
}
