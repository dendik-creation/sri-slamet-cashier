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
            ->when($by_amount_due, function ($query, $by_amount_due) {
                if($by_amount_due == "PAID"){
                    $query->where('amount_due', '=', 0);
                } else if($by_amount_due == "UNPAID"){
                    $query->where('amount_due', '>', 0);
                }
            })
            ->orderBy('order_at', $by_order)
            ->paginate(config('custom.pagination_size'));

        return Inertia::render('Cashier/Transaction/Index', [
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

    public function create()
    {
        $app_setting = AppSetting::getSetting();
        $customers = Customer::select('id', 'name', 'phone', 'address')
            ->get()
            ->map(function ($customer) {
                return [
                    'label' => $customer->name,
                    'value' => $customer->id,
                    'additional_info' => [
                        'phone' => $customer->phone,
                        'address' => $customer->address,
                    ],
                ];
            });
        return Inertia::render('Cashier/Transaction/New', [
            'title' => 'Transaksi Baru',
            'description' => 'Buat transaksi jasa perbaikan baru',
            'customers' => $customers,
            'app_setting' => $app_setting,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'is_new_customer' => 'required|boolean',
            'trx.invoice_code' => 'required|unique:transactions,invoice_code',
            'trx.customer_id' => [$request->input('is_new_customer') ? 'nullable' : 'required', 'exists:customers,id'],
            'trx.customer_name' => 'required|string',
            'trx.customer_phone' => 'required|string',
            'trx.customer_address' => 'required|string',
            'trx.order_at' => 'required',
            'trx.trx_items' => 'required|array|min:1',
            'trx.trx_items.*.description' => 'required|string',
            'trx.trx_items.*.line_total' => 'required|numeric',
            'trx.subtotal' => 'required|numeric',
            'trx.tax_ppn' => 'required|numeric',
            'trx.total' => 'required|numeric',
            'trx.notes' => 'nullable|string',
            'trx.payment_plan' => 'nullable|in:FULL_PAID,INSTALMENT',
            'trx.payments' => 'nullable|array',
            'trx.payments.*.payment_method' => 'nullable|string',
            'trx.payments.*.amount' => 'nullable|numeric',
        ]);

        $auth = Auth::user();
        $transaction = [
            'customer_id' => null,
            'cashier_id' => $auth->id,
            'invoice_code' => $validated['trx']['invoice_code'],
            'order_at' => $validated['trx']['order_at'],
            'status' => Transaction::STATUS_IN_PROGRESS,
            'subtotal' => $validated['trx']['subtotal'],
            'tax_ppn' => $validated['trx']['tax_ppn'],
            'payment_plan' => $validated['trx']['payment_plan'] ?: null,
            'notes' => $validated['trx']['notes'],
            'total' => $validated['trx']['total'],
            'amount_due' => $validated['trx']['total'],
        ];
        $transaction_items = [];
        $transaction_payments = [];

        // Save Customer
        if ($validated['is_new_customer']) {
            $new_cust = Customer::create([
                'name' => $validated['trx']['customer_name'],
                'phone' => $validated['trx']['customer_phone'],
                'address' => $validated['trx']['customer_address'],
            ]);
            $transaction['customer_id'] = $new_cust['id'];
        } else {
            $transaction['customer_id'] = $validated['trx']['customer_id'];
        }

        // Amount Due Calculation
        $total_paid = 0;
        if ($transaction['payment_plan'] != null) {
            foreach ($validated['trx']['payments'] as $payment) {
                $total_paid += $payment['amount'];
            }
        }
        $transaction['amount_due'] = $transaction['total'] - $total_paid;

        // Insert Trx
        $inserted_trx = Transaction::create($transaction);

        // Fill Trx Items
        foreach ($validated['trx']['trx_items'] as $item) {
            $transaction_items[] = [
                'transaction_id' => $inserted_trx->id,
                'description' => $item['description'],
                'line_total' => $item['line_total'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert Trx Items
        DB::table('transaction_items')->insert($transaction_items);

        // Fill Trx payments if exist
        if ($transaction['payment_plan'] != null) {
            foreach ($validated['trx']['payments'] as $payment) {
                $transaction_payments[] = [
                    'transaction_id' => $inserted_trx->id,
                    'recorded_by' => $auth->id,
                    'method' => $payment['payment_method'],
                    'amount' => $payment['amount'],
                    'paid_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert trx payment if exist
        if ($transaction['payment_plan'] != null) {
            DB::table('payments')->insert($transaction_payments);
        }

        Session::flash('success', 'Transaksi berhasil disimpan');
        return Inertia::location(route('cashier.transactions.new'));
    }

    public function show($id)
    {
        $transaction = Transaction::with('customer', 'cashier', 'items', 'payments.recorder')->where('id', $id)->firstOrFail();

        return Inertia::render('Cashier/Transaction/Show', [
            'title' => 'Detail Transaksi',
            'description' => 'Lihat detail transaksi jasa perbaikan',
            'transaction' => $transaction,
        ]);
    }

    public function edit($id)
    {
        $transaction = Transaction::with('customer', 'cashier', 'items', 'payments.recorder')->where('id', $id)->firstOrFail();
        $app_setting = AppSetting::getSetting();
        $customers = Customer::select('id', 'name', 'phone', 'address')
            ->get()
            ->map(function ($customer) {
                return [
                    'label' => $customer->name,
                    'value' => $customer->id,
                    'additional_info' => [
                        'phone' => $customer->phone,
                        'address' => $customer->address,
                    ],
                ];
            });

        return Inertia::render('Cashier/Transaction/Edit', [
            'title' => 'Edit Transaksi',
            'description' => 'Edit transaksi jasa perbaikan',
            'transaction' => $transaction,
            'customers' => $customers,
            'app_setting' => $app_setting,
        ]);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::with(['items', 'payments'])
            ->where('id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'trx.invoice_code' => 'required|unique:transactions,invoice_code,' . $transaction->id,
            // Customer now always existing; must be provided
            'trx.customer_id' => ['required', 'exists:customers,id'],
            'trx.customer_name' => 'required|string',
            'trx.customer_phone' => 'required|string',
            'trx.customer_address' => 'required|string',
            'trx.order_at' => 'required',
            'trx.completed_at' => 'nullable|date',
            'trx.status' => 'required|in:IN_PROGRESS,COMPLETED,CLOSED',
            'trx.trx_items' => 'required|array|min:1',
            'trx.trx_items.*.description' => 'required|string',
            'trx.trx_items.*.line_total' => 'required|numeric',
            'trx.trx_items.*.status' => 'required|in:ACTIVE,REFUNDED,REPLACED',
            'trx.trx_items.*.reason' => 'nullable|string',
            'trx.subtotal' => 'required|numeric',
            'trx.tax_ppn' => 'required|numeric',
            'trx.total' => 'required|numeric',
            'trx.notes' => 'nullable|string',
            'trx.payment_plan' => 'nullable|in:FULL_PAID,INSTALMENT',
            'trx.payments' => 'nullable|array',
            'trx.payments.*.payment_method' => 'nullable|string',
            'trx.payments.*.amount' => 'nullable|numeric',
        ]);

        $auth = Auth::user();

        // Manual refund_reason validation for refunded items
        foreach ($validated['trx']['trx_items'] as $idx => $item) {
            if ($item['status'] === TransactionItem::STATUS_REFUNDED) {
                if (!array_key_exists('refund_reason', $item) || $item['refund_reason'] === null || trim($item['refund_reason']) === '') {
                    return back()
                        ->withErrors([
                            "trx.trx_items.$idx.refund_reason" => 'Alasan wajib diisi untuk item yang direfund',
                        ])
                        ->withInput();
                }
            }
        }

        DB::beginTransaction();
        try {
            // Customer always existing now; assign and optionally sync basic info
            $transaction->customer_id = $validated['trx']['customer_id'];
            if ($transaction->customer_id) {
                Customer::where('id', $transaction->customer_id)->update([
                    'name' => $validated['trx']['customer_name'],
                    'phone' => $validated['trx']['customer_phone'],
                    'address' => $validated['trx']['customer_address'],
                ]);
            }

            // Update main transaction fields
            $transaction->invoice_code = $validated['trx']['invoice_code'];
            $transaction->order_at = $validated['trx']['order_at'];
            $transaction->notes = $validated['trx']['notes'];
            $transaction->payment_plan = $validated['trx']['payment_plan'] ?: null;
            $transaction->tax_ppn = $validated['trx']['tax_ppn'];
            $prevStatus = $transaction->status;
            $transaction->status = $validated['trx']['status'];
            // completed_at logic: if provided use it; if status transitioned to COMPLETED and no completed_at given, set now
            if (!empty($validated['trx']['completed_at'])) {
                $transaction->completed_at = $validated['trx']['completed_at'];
            } elseif ($prevStatus !== 'COMPLETED' && $transaction->status === 'COMPLETED' && !$transaction->completed_at) {
                $transaction->completed_at = now();
            } elseif ($transaction->status !== 'COMPLETED') {
                // If moved back to non-completed we can null it (optional). Keeping existing unless explicitly requested.
                // $transaction->completed_at = null; // Uncomment if business requires.
            }

            // Handle items
            $submittedItems = $validated['trx']['trx_items'];
            $existingItemsById = $transaction->items->keyBy('id');
            $submittedIds = collect($submittedItems)->filter(fn($i) => array_key_exists('id', $i) && $i['id'])->pluck('id')->all();

            // Soft delete items not submitted anymore
            $transaction->items->filter(fn($itm) => !in_array($itm->id, $submittedIds))->each(function ($itm) {
                $itm->delete();
            });

            $recalculatedSubtotal = 0;
            foreach ($submittedItems as $itemData) {
                $itemId = $itemData['id'] ?? null;
                $status = $itemData['status'];
                $lineTotal = (int) $itemData['line_total'];
                $description = $itemData['description'];
                $refundReason = $itemData['refund_reason'] ?? null;

                if ($itemId && $existingItemsById->has($itemId)) {
                    $itemModel = $existingItemsById[$itemId];
                    $previousStatus = $itemModel->status;
                    $itemModel->description = $description;
                    $itemModel->line_total = $lineTotal;
                    $itemModel->status = $status;
                    // Set or clear refund_reason
                    if ($status === TransactionItem::STATUS_REFUNDED) {
                        $itemModel->refund_reason = $refundReason;
                    } elseif ($previousStatus === TransactionItem::STATUS_REFUNDED && $status !== TransactionItem::STATUS_REFUNDED) {
                        $itemModel->refund_reason = null;
                    }
                    $itemModel->save();
                } else {
                    // New item
                    $newItem = DB::table('transaction_items')->insertGetId([
                        'transaction_id' => $transaction->id,
                        'description' => $description,
                        'line_total' => $lineTotal,
                        'status' => $status,
                        'refund_reason' => $status === TransactionItem::STATUS_REFUNDED ? $refundReason : null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Only count non-refunded items toward subtotal
                if ($status !== 'REFUNDED') {
                    $recalculatedSubtotal += $lineTotal;
                }
            }

            // refund_items removed; inline refund_reason stored directly on transaction_items

            // Recalculate totals based on non-refunded items
            $transaction->subtotal = $recalculatedSubtotal;
            $transaction->total = $recalculatedSubtotal + $recalculatedSubtotal * ($transaction->tax_ppn / 100);

            // Handle payments
            $submittedPayments = $validated['trx']['payments'] ?? [];
            $existingPaymentsById = $transaction->payments->keyBy('id');
            $submittedPaymentIds = collect($submittedPayments)->filter(fn($p) => array_key_exists('id', $p) && $p['id'])->pluck('id')->all();

            // Soft delete removed payments
            $transaction->payments->filter(fn($pay) => !in_array($pay->id, $submittedPaymentIds))->each(function ($pay) {
                $pay->delete();
            });

            $totalPaid = 0;
            foreach ($submittedPayments as $paymentData) {
                $paymentId = $paymentData['id'] ?? null;
                $method = $paymentData['payment_method'];
                $amount = (int) ($paymentData['amount'] ?? 0);
                if ($amount < 0) {
                    $amount = 0;
                }

                if ($paymentId && $existingPaymentsById->has($paymentId)) {
                    $paymentModel = $existingPaymentsById[$paymentId];
                    $paymentModel->method = $method;
                    $paymentModel->amount = $amount;
                    $paymentModel->save();
                } else {
                    if ($transaction->payment_plan !== null) {
                        DB::table('payments')->insert([
                            'transaction_id' => $transaction->id,
                            'recorded_by' => $auth->id,
                            'method' => $method,
                            'amount' => $amount,
                            'paid_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                if ($transaction->payment_plan !== null) {
                    $totalPaid += $amount;
                }
            }

            $transaction->amount_due = $transaction->total - $totalPaid;

            // Jika sudah lunas (amount_due <= 0) maka tandai semua item ACTIVE menjadi COMPLETED
            // dan paksa status transaksi menjadi COMPLETED serta set completed_at bila belum.
            if ($transaction->amount_due <= 0) {
                // Update item yang masih ACTIVE saja
                $transaction->items()
                    ->where('status', TransactionItem::STATUS_ACTIVE)
                    ->update(['status' => TransactionItem::STATUS_COMPLETED]);

                // Paksa status transaksi ke COMPLETED
                $transaction->status = Transaction::STATUS_COMPLETED;
                if (!$transaction->completed_at) {
                    $transaction->completed_at = now();
                }
            }
            $transaction->save();

            DB::commit();
            Session::flash('success', 'Transaksi berhasil diperbarui');
            return Inertia::location(route('cashier.transactions.show', ['id' => $transaction->id]));
        } catch (\Throwable $e) {
            DB::rollBack();
            dd($e);
            return back()
                ->withErrors(['error' => 'Gagal memperbarui transaksi'])
                ->withInput();
        }
    }
}
