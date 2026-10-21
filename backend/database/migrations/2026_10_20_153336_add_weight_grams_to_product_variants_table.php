<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('product_variants', 'weight_grams')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->unsignedInteger('weight_grams')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('product_variants', 'weight_grams')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->dropColumn('weight_grams');
            });
        }
    }
};
