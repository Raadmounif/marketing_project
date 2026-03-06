<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_id', 'name_ar', 'name_en', 'photos',
        'promo_code', 'promo_expiry', 'promo_discount',
        'unit_total_price', 'marketer_fee_per_unit', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'promo_expiry' => 'date',
            'unit_total_price' => 'float',
            'marketer_fee_per_unit' => 'float',
            'price_per_unit' => 'float',
            'promo_discount' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function isPromoValid(): bool
    {
        if (!$this->promo_code || !$this->promo_expiry) {
            return false;
        }
        return $this->promo_expiry->isFuture();
    }
}
