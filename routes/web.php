<?php

use App\Http\Controllers\global\AuthController;
use App\Http\Controllers\global\DashboardController;
use App\Http\Middleware\adminAccess;
use App\Http\Middleware\cashierAccess;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthController::class, 'signedInStatus'])->name('login');
Route::prefix('auth')->group(function () {
    Route::get('/signin', [AuthController::class, 'signInView'])
        ->name('auth.signin')
        ->middleware('guest');

    Route::post('/signin', [AuthController::class, 'signIn'])->middleware('guest');
});

// Admin Routes
Route::prefix('admin')->middleware(['auth', adminAccess::class])->group(function(){
    Route::get('/dashboard', [DashboardController::class, 'adminDashboard'])->name('admin.dashboard');
});

// Cashier Routes
Route::prefix('cashier')->middleware(['auth', cashierAccess::class])->group(function(){
    Route::get('/dashboard', [DashboardController::class, 'cashierDashboard'])->name('cashier.dashboard');
});

