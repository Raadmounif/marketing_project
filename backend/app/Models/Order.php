<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', 'user_id', 'product_id', 'quantity',
        'notes', 'total', 'marketer_fee_total', 'delivery_date',
        'status', 'receipt_path', 'receipt_uploaded_at', 'feedback',
    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'receipt_uploaded_at' => 'datetime',
            'total' => 'float',
            'marketer_fee_total' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public static function generateOrderNumber(): string
    {
        $month = now()->format('m');
        $year = now()->format('Y');
        $monthKey = "{$year}-{$month}";

        $counter = OrderCounter::lockForUpdate()->firstOrCreate(
            ['month' => $monthKey],
            ['counter' => 0]
        );

        $counter->increment('counter');
        $counter->refresh();

        return sprintf('%s-%04d', $month, $counter->counter);
    }
}
