<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                "name" => "Pelanggan 1",
                "phone" => "081234567890",
                "address" => "Jl. Merdeka No. 1, Kudus",
                "created_at" => now(),
                "updated_at" => now(),
            ],
        ];

        DB::table("customers")->insert($customers);
    }
}
