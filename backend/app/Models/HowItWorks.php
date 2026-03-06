<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HowItWorks extends Model
{
    use HasFactory;

    protected $table = 'how_it_works';

    protected $fillable = [
        'title_ar', 'title_en', 'body_ar', 'body_en', 'sort_order',
    ];
}
