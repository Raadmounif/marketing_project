<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Statistic extends Model
{
    use HasFactory;

    protected $fillable = [
        'successful_orders_count', 'cumulative_total', 'cumulative_marketer_fee',
    ];

    protected function casts(): array
    {
        return [
            'cumulative_total' => 'float',
            'cumulative_marketer_fee' => 'float',
        ];
    }

    public static function record(float $total, float $marketerFee): void
    {
        $stat = static::first();
        if ($stat) {
            $stat->increment('successful_orders_count');
            $stat->increment('cumulative_total', $total);
            $stat->increment('cumulative_marketer_fee', $marketerFee);
        } else {
            static::create([
                'successful_orders_count' => 1,
                'cumulative_total' => $total,
                'cumulative_marketer_fee' => $marketerFee,
            ]);
        }
    }
}
