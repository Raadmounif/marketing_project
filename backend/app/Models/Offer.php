<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar',
        'name_en',
        'code',
        'delivery_costs',
        'marketer_fee_schedule',
        'is_active',
        'promo_code',
        'promo_expiry',
        'promo_discount_percent',
        'csv_imported_at',
    ];

    /**
     * Staff-only; omitted from public offer JSON (see OfferController).
     */
    protected $hidden = [
        'csv_imported_at',
    ];

    protected function casts(): array
    {
        return [
            'delivery_costs'            => 'array',
            'marketer_fee_schedule'     => 'array',
            'is_active'                 => 'boolean',
            'promo_expiry'              => 'date',
            'promo_discount_percent'    => 'float',
            'csv_imported_at'           => 'datetime',
        ];
    }

    public function hasActivePromo(): bool
    {
        if (! $this->promo_code || ! $this->promo_expiry) {
            return false;
        }

        return $this->promo_expiry->isFuture()
            && ($this->promo_discount_percent ?? 0) > 0;
    }

    public function sections()
    {
        return $this->hasMany(OfferSection::class)->orderBy('sort_order');
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

        if (!$schedule || !is_array($schedule)) {
            return 0.0;
        }

        $stateExtras = $schedule['state_extras'] ?? [];
        $stateExtra = (float) (is_array($stateExtras) ? ($stateExtras[$state] ?? 0) : 0);

        // 5+ units: no qty fee, only state extra
        if ($quantity >= 5) {
            return $stateExtra;
        }

        $qtyFees = $schedule['qty_fees'] ?? [];
        $qtyFee = (float) (is_array($qtyFees) ? ($qtyFees[(string) $quantity] ?? 0) : 0);

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
