<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar', 'name_en', 'code', 'delivery_costs', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'delivery_costs' => 'array',
            'is_active' => 'boolean',
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
}
