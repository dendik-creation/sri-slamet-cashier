<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RefundItem extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    // Casts
    protected $casts = [
        'order_id' => 'integer',
        'order_item_id' => 'integer',
        'recorded_by' => 'integer',
        'refund_amount' => 'integer',
    ];

}
