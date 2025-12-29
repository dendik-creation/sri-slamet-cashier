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
        Schema::create("customers_new", function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->string("slug")->unique();
            $table->string("phone")->nullable();
            $table->text("address");
            $table->timestamps();
        });

        if (Schema::hasTable("customers") && DB::table("customers")->exists()) {
            DB::statement("
                INSERT INTO customers_new (id, name, slug, phone, address, created_at, updated_at)
                SELECT
                    id,
                    name,
                    lower(
                        replace(
                            replace(name, ' ', '-'),
                            '--', '-'
                        )
                    ),
                    phone,
                    address,
                    created_at,
                    updated_at
                FROM customers
            ");
        }

        Schema::drop("customers");
        Schema::rename("customers_new", "customers");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("customers_new");
        Schema::dropIfExists("customers");
    }
};
