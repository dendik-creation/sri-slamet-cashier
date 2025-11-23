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
                'name' => 'Budi Gedagedi',
                'phone' => '081234567890',
                'address' => 'Jl. Merdeka No. 1, Jakarta',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Siti Aminah',
                'phone' => '082345678901',
                'address' => 'Jl. Sudirman No. 2, Bandung',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Andi Saputra',
                'phone' => '083456789012',
                'address' => 'Jl. Thamrin No. 3, Surabaya',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('customers')->insert($customers);
    }
}
