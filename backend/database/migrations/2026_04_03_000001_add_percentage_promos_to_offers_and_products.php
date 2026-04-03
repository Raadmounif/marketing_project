<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->string('promo_code')->nullable()->after('is_active');
            $table->date('promo_expiry')->nullable();
            $table->decimal('promo_discount_percent', 5, 2)->nullable();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('promo_discount_percent', 5, 2)->nullable()->after('promo_expiry');
        });

        if (Schema::hasColumn('products', 'promo_discount')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('promo_discount');
            });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('promo_discount', 10, 2)->nullable()->after('promo_expiry');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('promo_discount_percent');
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn(['promo_code', 'promo_expiry', 'promo_discount_percent']);
        });
    }
};
