<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pool dana ongkir per toko: dana pengiriman yang dibayar pembeli.
     * Tidak pernah masuk available_balance / escrow_held_balance sehingga tidak bisa dicairkan seller.
     */
    public function up(): void
    {
        Schema::table('merchant_wallets', function (Blueprint $table) {
            $table->decimal('shipping_held_balance', 15, 2)->default(0.00);
        });
    }

    public function down(): void
    {
        Schema::table('merchant_wallets', function (Blueprint $table) {
            $table->dropColumn('shipping_held_balance');
        });
    }
};
