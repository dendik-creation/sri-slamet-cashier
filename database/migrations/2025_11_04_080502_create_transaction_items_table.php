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
        Schema::create("transaction_items", function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId("transaction_id")
                ->constrained("transactions")
                ->cascadeOnDelete();
            $table->string("description");
            $table->integer("line_total")->default(0);
            $table
                ->enum("status", [
                    "ACTIVE",
                    "REFUNDED",
                    "REPLACED",
                    "COMPLETED",
                ])
                ->default("ACTIVE");
            $table->string("refund_reason")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("transaction_items");
    }
};
