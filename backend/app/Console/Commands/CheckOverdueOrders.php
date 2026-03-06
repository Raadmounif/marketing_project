<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CheckOverdueOrders extends Command
{
    protected $signature = 'orders:check-overdue';
    protected $description = 'Flag orders that are older than 24 hours without a receipt upload';

    public function handle(): void
    {
        $count = Order::where('status', 'ordered')
            ->where('created_at', '<=', Carbon::now()->subHours(24))
            ->whereNull('receipt_path')
            ->count();

        $this->info("Found {$count} overdue order(s) awaiting receipt.");
    }
}
