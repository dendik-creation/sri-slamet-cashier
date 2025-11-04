<?php

namespace App\Http\Controllers\global;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function adminDashboard(){
        return Inertia::render('Admin/Dashboard', [
            'title' => "Dashboard",
            'description' => "Halaman utama untuk melihat ringkasan data kasir",
        ]);
    }
    
    public function cashierDashboard(){
        return Inertia::render('Cashier/Dashboard', [
            'title' => "Dashboard",
            'description' => "Halaman utama untuk melihat ringkasan data kasir",
        ]);
    }
}
