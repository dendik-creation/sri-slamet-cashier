<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    protected $guarded = ["id"];

    // Const
    const STATUS_ACTIVE = "ACTIVE";
    const STATUS_REFUNDED = "REFUNDED";
    const STATUS_REPLACED = "REPLACED";
    const STATUS_COMPLETED = "COMPLETED";

    // Casts
    protected $casts = [
        "transaction_id" => "integer",
        "line_total" => "integer",
        "refund_reason" => "string",
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, "transaction_id");
    }
}
