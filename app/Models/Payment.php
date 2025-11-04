<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;
    protected $guarded = ['id'];

    // Const
    const METHOD_CASH = 'CASH';
    const METHOD_TRANSFER = 'TRANSFER';
    const METHOD_OTHER = 'OTHER';

    // Casts
    protected $casts = [
        'order_id' => 'integer',
        'recorded_by' => 'integer',
        'amount' => 'integer',
    ];
}
