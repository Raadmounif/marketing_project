<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\HowItWorksController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatisticController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public endpoints
Route::get('/offers', [OfferController::class, 'index']);
Route::get('/offers/{offer}', [OfferController::class, 'show']);
Route::get('/offers/{offer}/products', [ProductController::class, 'index']);
Route::get('/advertising-boards', [BoardController::class, 'index']);
Route::get('/how-it-works', [HowItWorksController::class, 'index']);

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authenticated routes (all roles)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Customer orders
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/receipt', [OrderController::class, 'uploadReceipt']);
    Route::delete('/orders/{order}/receipt', [OrderController::class, 'deleteReceipt']);
    Route::get('/orders/{order}/receipt-file', [OrderController::class, 'receiptFile']);
    Route::patch('/orders/{order}/feedback', [OrderController::class, 'submitFeedback']);

    // Favorites
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{product}', [FavoriteController::class, 'destroy']);

    // Own password reset (via profile — covered by PUT /profile)
});

// Staff + Admin routes
Route::middleware(['auth:sanctum', 'role:staff,admin'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{order}/commission', [OrderController::class, 'toggleCommission']);
    Route::get('/notifications/overdue', [NotificationController::class, 'index']);
    Route::get('/statistics', [StatisticController::class, 'index']);

    Route::post('/offers', [OfferController::class, 'store']);
    Route::put('/offers/{offer}', [OfferController::class, 'update']);
    Route::delete('/offers/{offer}', [OfferController::class, 'destroy']);

    Route::post('/offers/{offer}/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::patch('/products/{product}/toggle', [ProductController::class, 'toggleActive']);
    Route::post('/offers/{offer}/products/bulk-update', [ProductController::class, 'bulkUpdate']);

    Route::post('/advertising-boards', [BoardController::class, 'store']);
    Route::put('/advertising-boards/{board}', [BoardController::class, 'update']);
    Route::delete('/advertising-boards/{board}', [BoardController::class, 'destroy']);

    Route::post('/how-it-works', [HowItWorksController::class, 'store']);
    Route::put('/how-it-works/{item}', [HowItWorksController::class, 'update']);
    Route::delete('/how-it-works/{item}', [HowItWorksController::class, 'destroy']);

    // User management (admin sees staff+customers, staff sees customers only)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
});

// Admin-only routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
});
