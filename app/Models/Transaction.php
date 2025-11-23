<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use SoftDeletes;
    protected $guarded = ['id'];

    // Const
    const STATUS_IN_PROGRESS = 'IN_PROGRESS';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_CLOSED = 'CLOSED';
    const PAYMENT_PLAN_FULL_PAID = 'FULL_PAID';
    const PAYMENT_PLAN_INSTALMENT = 'INSTALMENT';

    protected $casts = [
        'cashier_id' => 'integer',
        'customer_id' => 'integer',
        'subtotal' => 'integer',
        'tax_ppn' => 'integer',
        'total' => 'integer',
        'amount_due' => 'integer',
    ];

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class, 'transaction_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'transaction_id');
    }
}