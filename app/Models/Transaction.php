<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $guarded = ["id"];

    // Const
    const STATUS_IN_PROGRESS = "IN_PROGRESS";
    const STATUS_COMPLETED = "COMPLETED";
    const STATUS_CLOSED = "CLOSED";

    protected $casts = [
        "cashier_id" => "integer",
        "customer_id" => "integer",
        "subtotal" => "integer",
        "tax_ppn" => "integer",
        "total" => "integer",
        "is_paid" => "boolean",
    ];

    public function cashier()
    {
        return $this->belongsTo(User::class, "cashier_id");
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, "customer_id");
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class, "transaction_id");
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, "transaction_id");
    }
}
