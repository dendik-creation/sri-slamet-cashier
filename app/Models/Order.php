<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;
    protected $guarded = ['id'];

    // Const
    const STATUS_DRAFT = 'DRAFT';
    const STATUS_IN_PROGRESS = 'IN_PROGRESS';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_CLOSED = 'CLOSED';
    const PAYMENT_PLAN_CASH = 'CASH';
    const PAYMENT_PLAN_DP = 'DP';
    const PAYMENT_PLAN_KASBON = 'KASBON';

    protected $casts = [
        'cashier_id' => 'integer',
        'customer_id' => 'integer',
        'subtotal' => 'integer',
        'tax_ppn' => 'integer',
        'total' => 'integer',
        'amount_paid' => 'integer',
        'amount_due' => 'integer',
    ];
}
