<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AppSetting::create([
            'app_name' => 'Kasir Sri Slamet',
            'head_address' => "Jl. H. Agus Salim 170 Telp. 437705 Kudus",
            'branch_address' => 'Jl. Jepara 145 Telp. 437396 Kudus',
            'tax_applied' => 11,
        ]);
    }
}
