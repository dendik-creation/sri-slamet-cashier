<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create("transactions", function (Blueprint $table) {
            $table->id();
            $table->string("invoice_code")->unique();
            $table
                ->foreignId("cashier_id")
                ->constrained("users")
                ->cascadeOnDelete();
            $table
                ->foreignId("customer_id")
                ->nullable()
                ->constrained("customers")
                ->cascadeOnDelete();
            $table->timestamp("order_at")->default(now());
            $table
                ->enum("status", ["IN_PROGRESS", "COMPLETED", "CLOSED"])
                ->default("IN_PROGRESS");
            $table->integer("subtotal")->default(0);
            $table->integer("tax_ppn")->default(0);
            $table->integer("total")->default(0);
            $table->boolean("is_paid")->default(false);
            $table->timestamp("completed_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("transactions");
    }
};
