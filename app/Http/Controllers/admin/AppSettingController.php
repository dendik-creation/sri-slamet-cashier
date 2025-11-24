<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class AppSettingController extends Controller
{
    public function index()
    {
        $app_setting = AppSetting::getSetting();
        return Inertia::render('Admin/AppSetting/Index', [
            'title' => 'Pengaturan Sistem',
            'description' => 'Kelola pengaturan sistem aplikasi kasir',
            'app_setting' => $app_setting,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'head_address' => 'required|string|max:500',
            'branch_address' => 'required|string|max:500',
            'tax_applied' => 'required|integer|min:0|max:100',
        ]);

        $app_setting = AppSetting::getSetting();
        $app_setting->fill($validated);
        $app_setting->save();

        Session::flash('success', 'Pengaturan sistem berhasil diperbarui.');
        return Inertia::location('/admin/app-setting');
    }
}
