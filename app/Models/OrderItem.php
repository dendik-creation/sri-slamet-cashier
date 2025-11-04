<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderItem extends Model
{
    use SoftDeletes;
    protected $guarded = ['id'];

    // Const
    const STATUS_ACTIVE = 'ACTIVE';
    const STATUS_REFUNDED = 'REFUNDED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_REPLACED = 'REPLACED';

    // Casts
    protected $casts = [
        'order_id' => 'integer',
        'line_total' => 'integer',
    ];
}
