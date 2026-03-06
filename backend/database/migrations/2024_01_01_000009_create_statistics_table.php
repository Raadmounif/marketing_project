<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statistics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('successful_orders_count')->default(0);
            $table->decimal('cumulative_total', 15, 2)->default(0);
            $table->decimal('cumulative_marketer_fee', 15, 2)->default(0);
            $table->timestamps();
        });

        DB::table('statistics')->insert([
            ['successful_orders_count' => 0, 'cumulative_total' => 0, 'cumulative_marketer_fee' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('statistics');
    }
};
