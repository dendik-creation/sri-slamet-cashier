<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $guarded = ['id'];

    // Casts
    protected $casts = [
        'tax_applied' => 'integer'
    ];

    // Get Setting
    public static function getSetting()
    {
        return self::first();
    }
}
