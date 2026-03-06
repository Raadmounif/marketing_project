<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->onDelete('cascade');
            $table->string('name_ar');
            $table->string('name_en');
            $table->json('photos')->nullable();
            $table->string('promo_code')->nullable();
            $table->date('promo_expiry')->nullable();
            $table->decimal('promo_discount', 10, 2)->nullable();
            $table->decimal('unit_total_price', 10, 2);
            $table->decimal('marketer_fee_per_unit', 10, 2);
            $table->decimal('price_per_unit', 10, 2)->storedAs('unit_total_price - marketer_fee_per_unit');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
