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

    // Casts
    protected $casts = [
        'transaction_id' => 'integer',
        'recorded_by' => 'integer',
        'amount' => 'integer',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
