<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar', 'name_en', 'code', 'delivery_costs', 'marketer_fee_schedule', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'delivery_costs'          => 'array',
            'marketer_fee_schedule'   => 'array',
            'is_active'               => 'boolean',
        ];
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function activeProducts()
    {
        return $this->hasMany(Product::class)->where('is_active', true);
    }

    public function getDeliveryCostForState(string $state): float
    {
        $costs = $this->delivery_costs;
        return (float) ($costs[$state] ?? $costs['other'] ?? 0);
    }

    /**
     * Get delivery fee for customer (qty_fee + state_extra).
     * For 5+ units: qty_fee = 0, but state_extra still applies.
     */
    public function getDeliveryFeeForOrder(int $quantity, string $state): float
    {
        $schedule = $this->marketer_fee_schedule;

        if (!$schedule) {
            return 0.0;
        }

        $stateExtra = (float) ($schedule['state_extras'][$state] ?? 0);

        // 5+ units: no qty fee, only state extra
        if ($quantity >= 5) {
            return $stateExtra;
        }

        $qtyFee = (float) ($schedule['qty_fees'][(string) $quantity] ?? 0);

        return $qtyFee + $stateExtra;
    }

    /**
     * Calculate marketer fee (= delivery fee) for a given quantity and customer state.
     */
    public function calculateMarketerFee(int $quantity, string $state, float $fallbackPerUnit): float
    {
        $schedule = $this->marketer_fee_schedule;

        if (!$schedule || empty($schedule['qty_fees'])) {
            return $quantity * $fallbackPerUnit;
        }

        return $this->getDeliveryFeeForOrder($quantity, $state);
    }
}
