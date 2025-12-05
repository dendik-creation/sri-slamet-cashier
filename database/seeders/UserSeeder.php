<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();
        $admin = [
            "username" => "admin",
            "name" => "Tuan Alam",
            "password" => Hash::make("12345"),
            "role" => "ADMIN",
            "created_at" => $now,
            "updated_at" => $now,
        ];
        $cashiers = [
            [
                "username" => "kasir1",
                "name" => "Kasir Bengkel Utara",
                "password" => Hash::make("12345"),
                "role" => "CASHIER",
                "created_at" => $now,
                "updated_at" => $now,
            ],
            [
                "username" => "kasir2",
                "name" => "Kasir Bengkel Selatan",
                "password" => Hash::make("12345"),
                "role" => "CASHIER",
                "created_at" => $now,
                "updated_at" => $now,
            ],
        ];

        DB::table("users")->insert(array_merge([$admin], $cashiers));
    }
}
