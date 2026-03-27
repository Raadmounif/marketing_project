<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfferSection extends Model
{
    protected $table = 'offer_sections';

    protected $fillable = [
        'offer_id',
        'name_ar',
        'name_en',
        'sort_order',
        'marketer_fee_per_unit',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'marketer_fee_per_unit' => 'float',
        ];
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'section_id');
    }
}
