<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('section_id')->nullable()->after('offer_id');
        });

        $offerIds = DB::table('offers')->pluck('id');
        foreach ($offerIds as $offerId) {
            $sectionId = DB::table('offer_sections')->insertGetId([
                'offer_id' => $offerId,
                'name_ar' => 'عام',
                'name_en' => 'General',
                'sort_order' => 0,
                'marketer_fee_per_unit' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('products')->where('offer_id', $offerId)->update(['section_id' => $sectionId]);
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE products MODIFY section_id BIGINT UNSIGNED NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE products ALTER COLUMN section_id SET NOT NULL');
        }

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('section_id')->references('id')->on('offer_sections')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');
        });
    }
};
