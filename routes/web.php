<?php

use App\Http\Controllers\global\AuthController;
use App\Http\Controllers\global\DashboardController;
use App\Http\Middleware\adminAccess;
use App\Http\Middleware\cashierAccess;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\admin\UserController as AdminUserController;


Route::get('/', [AuthController::class, 'signedInStatus'])->name('login');
Route::prefix('auth')->group(function () {
    Route::get('/signin', [AuthController::class, 'signInView'])
        ->name('auth.signin')
        ->middleware('guest');

    Route::post('/signin', [AuthController::class, 'signIn'])->middleware('guest');
});
Route::post('/auth/signout', [AuthController::class, 'signOut'])->middleware('auth');

// Admin Routes
Route::prefix('admin')->middleware(['auth', adminAccess::class])->group(function(){
    Route::get('/dashboard', [DashboardController::class, 'adminDashboard'])->name('admin.dashboard');
    // Master Users
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::put('/users/{id}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::put('/users/{id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('admin.users.reset-password');
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
});

// Cashier Routes
Route::prefix('cashier')->middleware(['auth', cashierAccess::class])->group(function(){
    Route::get('/dashboard', [DashboardController::class, 'cashierDashboard'])->name('cashier.dashboard');
    
});

