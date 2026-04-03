<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Idempotent: adds promo columns if missing (e.g. first migration not run on this DB).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('offers', 'promo_code')) {
            Schema::table('offers', function (Blueprint $table) {
                $table->string('promo_code')->nullable();
            });
        }
        if (! Schema::hasColumn('offers', 'promo_expiry')) {
            Schema::table('offers', function (Blueprint $table) {
                $table->date('promo_expiry')->nullable();
            });
        }
        if (! Schema::hasColumn('offers', 'promo_discount_percent')) {
            Schema::table('offers', function (Blueprint $table) {
                $table->decimal('promo_discount_percent', 5, 2)->nullable();
            });
        }

        if (! Schema::hasColumn('products', 'promo_discount_percent')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('promo_discount_percent', 5, 2)->nullable();
            });
        }

        if (Schema::hasColumn('products', 'promo_discount')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('promo_discount');
            });
        }
    }

    public function down(): void
    {
        // Non-reversible merge; keep columns
    }
};
