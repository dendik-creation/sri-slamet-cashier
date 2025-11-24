<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $by_search = $request->input('search', null);
        $by_status = $request->input('status', null);
        $by_order = $request->input('order', 'DESC');
        $by_start_date_in = $request->input('start_date_in', null);
        $by_end_date_in = $request->input('end_date_in', null);
        $by_amount_due = $request->input('amount_due', null);

        $transactions = Transaction::with('customer', 'cashier')
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
            ->when($by_order, function ($query) use ($by_order) {
                $query->orderBy('order_at', $by_order);
            }, function ($query) {
                $query->orderBy('order_at', 'DESC');
            })
            ->when($by_amount_due, function ($query, $by_amount_due) {
                if($by_amount_due == "PAID"){
                    $query->where('amount_due', '=', 0);
                } else if($by_amount_due == "UNPAID"){
                    $query->where('amount_due', '>', 0);
                }
            })
            ->paginate(config('custom.pagination_size'));

        return Inertia::render('Admin/Transaction/Index', [
            'title' => 'Daftar Transaksi',
            'description' => 'Kelola daftar transaksi jasa perbaikan',
            'transactions' => $transactions,
            'by_search' => $by_search,
            'by_status' => $by_status,
            'by_order' => $by_order,
            'by_start_date_in' => $by_start_date_in,
            'by_end_date_in' => $by_end_date_in,
        ]);
    }


    public function show($id)
    {
        $transaction = Transaction::with('customer', 'cashier', 'items', 'payments.recorder')->where('id', $id)->firstOrFail();

        return Inertia::render('Admin/Transaction/Show', [
            'title' => 'Detail Transaksi',
            'description' => 'Lihat detail transaksi jasa perbaikan',
            'transaction' => $transaction,
        ]);
    }
}
