<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $by_search = $request->input('search', null);
        $by_status = $request->input('status', null);
        $by_start_date_in = $request->input('start_date_in', null);
        $by_end_date_in = $request->input('end_date_in', null);
        $by_is_paid = $request->input('is_paid', null);
        $by_cashier = $request->input('cashier', null);

        $transactions = Transaction::with('customer', 'cashier', 'items')
            ->when($by_search, function ($query, $by_search) {
                $query->where(function ($q) use ($by_search) {
                    $q->where('invoice_code', 'like', '%' . $by_search . '%')->orWhereHas('customer', function ($q2) use ($by_search) {
                        $q2->where('name', 'like', '%' . $by_search . '%');
                    });
                });
            })
            ->when($by_status, function ($query, $by_status) {
                $query->where('status', $by_status);
            })
            ->when($by_start_date_in && $by_end_date_in, function ($query) use ($by_start_date_in, $by_end_date_in) {
                $query->whereBetween('order_at', [$by_start_date_in, $by_end_date_in]);
            })
            ->when($by_is_paid, function ($query, $by_is_paid) {
                if ($by_is_paid !== null) {
                    $query->where('is_paid', filter_var($by_is_paid, FILTER_VALIDATE_BOOLEAN));
                }
            })
            ->when($by_cashier, function ($query, $by_cashier) {
                $query->where('cashier_id', $by_cashier);
            })
            ->orderBy('order_at', 'DESC')
            ->paginate(config('custom.pagination_size'));
        
        $cashiers = User::where('role', User::ROLE_CASHIER)->get()->map(function ($user) {
            return [
                'value' => $user->id,
                'label' => $user->name,
            ];
        });

        return Inertia::render('Admin/Transaction/Index', [
            'title' => 'Daftar Transaksi',
            'description' => 'Kelola daftar transaksi jasa perbaikan',
            'transactions' => $transactions,
            'cashiers' => $cashiers,
            'by_search' => $by_search,
            'by_status' => $by_status,
            'by_start_date_in' => $by_start_date_in,
            'by_end_date_in' => $by_end_date_in,
        ]);
    }


    public function show($id)
    {
        $transaction = Transaction::with('customer', 'cashier', 'items', 'payment.recorder')->where('id', $id)->firstOrFail();

        return Inertia::render('Admin/Transaction/Show', [
            'title' => 'Detail Transaksi',
            'description' => 'Lihat detail transaksi jasa perbaikan',
            'transaction' => $transaction,
        ]);
    }

    public function print(Request $request)
    {
        $by_search = $request->input('search', null);
        $by_status = $request->input('status', null);
        $by_start_date_in = $request->input('start_date_in', null);
        $by_end_date_in = $request->input('end_date_in', null);
        $by_is_paid = $request->input('is_paid', null);
        $by_cashier = $request->input('cashier', null);

        $transactions = Transaction::with('customer', 'cashier')
            ->when($by_search, function ($query, $by_search) {
                $query->where(function ($q) use ($by_search) {
                    $q->where('invoice_code', 'like', '%' . $by_search . '%')
                        ->orWhereHas('customer', function ($q2) use ($by_search) {
                            $q2->where('name', 'like', '%' . $by_search . '%');
                        });
                });
            })
            ->when($by_status, function ($query, $by_status) {
                $query->where('status', $by_status);
            })
            ->when($by_start_date_in && $by_end_date_in, function ($query) use ($by_start_date_in, $by_end_date_in) {
                $query->whereBetween('order_at', [$by_start_date_in, $by_end_date_in]);
            })
            ->when($by_is_paid !== null && $by_is_paid !== '', function ($query) use ($by_is_paid) {
                $query->where('is_paid', filter_var($by_is_paid, FILTER_VALIDATE_BOOLEAN));
            })
            ->when($by_cashier, function ($query, $by_cashier) {
                $query->where('cashier_id', $by_cashier);
            })
            ->orderBy('order_at', 'DESC')
            ->get();

        return Inertia::render('Admin/Transaction/Print', [
            'title' => 'Cetak Laporan Transaksi',
            'description' => 'Cetak laporan transaksi jasa perbaikan berdasarkan periode dan filter',
            'transactions' => $transactions->map(function ($t) {
                return [
                    'id' => $t->id,
                    'invoice_code' => $t->invoice_code,
                    'status' => $t->status,
                    'is_paid' => (bool) $t->is_paid,
                    'total' => (int) $t->total,
                    'customer' => $t->customer ? ['id' => $t->customer->id, 'name' => $t->customer->name] : null,
                    'cashier' => $t->cashier ? ['id' => $t->cashier->id, 'name' => $t->cashier->name] : null,
                    'order_at' => $t->order_at,
                    'completed_at' => $t->completed_at,
                ];
            }),
            'filters' => [
                'search' => $by_search,
                'status' => $by_status,
                'start_date_in' => $by_start_date_in,
                'end_date_in' => $by_end_date_in,
                'is_paid' => $by_is_paid,
                'cashier' => User::find($by_cashier)?->name ?? null,
            ],
        ]);
    }
}
