<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_counters', function (Blueprint $table) {
            $table->id();
            $table->string('month', 7)->unique();
            // Format: YYYY-MM
            $table->unsignedInteger('counter')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_counters');
    }
};
