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
            'username' => 'admin',
            'name' => 'Administrator',
            'password' => Hash::make('12345'),
            'role' => 'ADMIN',
            'created_at' => $now,
            'updated_at' => $now,
        ];
        $cashiers = [
            [
                'username' => 'akmal_kasir',
                'name' => 'Akmal',
                'password' => Hash::make('12345'),
                'role' => 'CASHIER',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'username' => 'bambang_kasir',
                'name' => 'Bambang Budiman',
                'password' => Hash::make('12345'),
                'role' => 'CASHIER',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('users')->insert(array_merge([$admin], $cashiers));
    }
}
