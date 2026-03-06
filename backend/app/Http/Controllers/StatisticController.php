<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Statistic;
use Illuminate\Http\JsonResponse;

class StatisticController extends Controller
{
    public function index(): JsonResponse
    {
        $stat = Statistic::first();

        // Delivered orders with fee breakdown
        $deliveredOrders = Order::where('status', 'delivered')
            ->with('product', 'user')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'order_number', 'user_id', 'product_id', 'quantity',
                   'total', 'marketer_fee_total', 'commission_collected',
                   'created_at', 'delivery_date']);

        $collected   = $deliveredOrders->where('commission_collected', true)->sum('marketer_fee_total');
        $uncollected = $deliveredOrders->where('commission_collected', false)->sum('marketer_fee_total');

        return response()->json([
            'successful_orders_count'  => $stat->successful_orders_count ?? 0,
            'cumulative_total'         => $stat->cumulative_total ?? 0,
            'cumulative_marketer_fee'  => $stat->cumulative_marketer_fee ?? 0,
            'commission_collected'     => round($collected, 2),
            'commission_uncollected'   => round($uncollected, 2),
            'orders'                   => $deliveredOrders,
        ]);
    }
}
