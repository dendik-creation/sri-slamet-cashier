<?php

use App\Http\Middleware\adminAccess;
use App\Http\Middleware\cashierAccess;
use Illuminate\Support\Facades\Route;
// Admins
use App\Http\Controllers\admin\UserController as AdminUserController;
use App\Http\Controllers\admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\admin\TransactionController as AdminTransactionController;
// Cashiers
use App\Http\Controllers\cashier\CustomerController as CashierCustomerController;
use App\Http\Controllers\cashier\TransactionController as CashierTransactionController;
// Global
use App\Http\Controllers\global\AuthController;
use App\Http\Controllers\global\DashboardController;
use App\Http\Controllers\global\ReportController;

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
    Route::prefix('users')->group(function () {
        Route::get('/', [AdminUserController::class, 'index'])->name('admin.users.index');
        Route::post('/', [AdminUserController::class, 'store'])->name('admin.users.store');
        Route::put('/{id}', [AdminUserController::class, 'update'])->name('admin.users.update');
        Route::put('/{id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('admin.users.reset-password');
        Route::delete('/{id}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
    });

    // Master Customers
    Route::prefix('customers')->group(function () {
        Route::get('/', [AdminCustomerController::class, 'index'])->name('admin.customers.index');
        Route::post('/', [AdminCustomerController::class, 'store'])->name('admin.customers.store');
        Route::put('/{id}', [AdminCustomerController::class, 'update'])->name('admin.customers.update');
        Route::delete('/{id}', [AdminCustomerController::class, 'destroy'])->name('admin.customers.destroy');
    });

    // Transactions
    Route::prefix('transactions')->group(function(){
        Route::get('/', [AdminTransactionController::class, 'index'])->name('admin.transactions.index');
        Route::get('/{id}', [AdminTransactionController::class, 'show'])->name('admin.transactions.show');
    });

    // Financial Report
    Route::prefix('reports')->group(function(){
        // Same-page filtering (GET or POST) returns Index view
        Route::match(['get','post'],'/financial', [ReportController::class, 'adminReportView'])->name('admin.reports.financial.view');
        // Print view (GET) consumes current filters via query string
        Route::get('/financial/print', [ReportController::class, 'adminReportGenerate'])->name('admin.reports.financial.print');
    });
});

// Cashier Routes
Route::prefix('cashier')->middleware(['auth', cashierAccess::class])->group(function(){
    Route::get('/dashboard', [DashboardController::class, 'cashierDashboard'])->name('cashier.dashboard');
    
    // Master Customers
    Route::prefix('customers')->group(function () {
        Route::get('/', [CashierCustomerController::class, 'index'])->name('cashier.customers.index');
        Route::post('/', [CashierCustomerController::class, 'store'])->name('cashier.customers.store');
        Route::put('/{id}', [CashierCustomerController::class, 'update'])->name('cashier.customers.update');
        Route::delete('/{id}', [CashierCustomerController::class, 'destroy'])->name('cashier.customers.destroy');
    });

    // Transactions
    Route::prefix('transactions')->group(function(){
        Route::get('/records', [CashierTransactionController::class, 'index'])->name('cashier.transactions.index');
        Route::get('/new', [CashierTransactionController::class, 'create'])->name('cashier.transactions.new');
        Route::post('/new', [CashierTransactionController::class, 'store'])->name('cashier.transactions.store');
        Route::get('/{id}', [CashierTransactionController::class, 'show'])->name('cashier.transactions.show');
        Route::get('/edit/{id}', [CashierTransactionController::class, 'edit'])->name('cashier.transactions.edit');
        Route::put('/update/{id}', [CashierTransactionController::class, 'update'])->name('cashier.transaction.update');
    });
});

