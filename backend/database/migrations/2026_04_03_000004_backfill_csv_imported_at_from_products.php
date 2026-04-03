<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('offers', 'csv_imported_at')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('
                UPDATE offers o
                INNER JOIN (
                    SELECT offer_id, MAX(created_at) AS last_product_at
                    FROM products
                    GROUP BY offer_id
                ) p ON p.offer_id = o.id
                SET o.csv_imported_at = p.last_product_at
                WHERE o.csv_imported_at IS NULL
            ');
        } elseif ($driver === 'sqlite') {
            DB::statement('
                UPDATE offers
                SET csv_imported_at = (
                    SELECT MAX(created_at) FROM products WHERE products.offer_id = offers.id
                )
                WHERE csv_imported_at IS NULL
                AND EXISTS (SELECT 1 FROM products WHERE products.offer_id = offers.id)
            ');
        } else {
            $offerIds = DB::table('products')
                ->select('offer_id')
                ->selectRaw('MAX(created_at) as last_at')
                ->groupBy('offer_id')
                ->get();

            foreach ($offerIds as $row) {
                DB::table('offers')
                    ->where('id', $row->offer_id)
                    ->whereNull('csv_imported_at')
                    ->update(['csv_imported_at' => $row->last_at]);
            }
        }
    }

    public function down(): void
    {
        // Non-reversible; we do not clear csv_imported_at.
    }
};
