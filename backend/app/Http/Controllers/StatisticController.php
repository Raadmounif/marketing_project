<?php

namespace App\Http\Controllers;

use App\Models\Statistic;
use Illuminate\Http\JsonResponse;

class StatisticController extends Controller
{
    public function index(): JsonResponse
    {
        $stat = Statistic::first();

        return response()->json($stat ?? [
            'successful_orders_count' => 0,
            'cumulative_total' => 0,
            'cumulative_marketer_fee' => 0,
        ]);
    }
}
