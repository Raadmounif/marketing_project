<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $overdueOrders = Order::where('status', 'ordered')
            ->where('created_at', '<=', Carbon::now()->subHours(24))
            ->whereNull('receipt_path')
            ->with('user', 'product.offer')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($overdueOrders);
    }
}
