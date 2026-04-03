<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdvertisingBoard extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_ar', 'content_en', 'image_path', 'is_active', 'sort_order',
    ];

    /**
     * Full URL for the hero image (cPanel: APP_URL + /public/storage/…).
     * Override with PUBLIC_STORAGE_URL in .env if your host uses a CDN or different path.
     */
    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        $path = ltrim(str_replace('\\', '/', $this->image_path), '/');
        $base = config('storage_public.url');
        $root = $base
            ? rtrim($base, '/')
            : rtrim((string) config('app.url'), '/').'/public/storage';

        return $root.'/'.$path;
    }
}
