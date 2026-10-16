<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('doku_invoice_id', 100)->nullable()->unique();
            $table->text('payment_url')->nullable();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('xendit_invoice_id', 100)->nullable()->change();
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->string('doku_sub_account_id', 100)->nullable()->unique();
            $table->string('doku_account_status', 50)->default('unregistered');
        });

        Schema::table('payouts', function (Blueprint $table) {
            $table->string('doku_payout_id', 100)->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['doku_invoice_id', 'payment_url']);
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['doku_sub_account_id', 'doku_account_status']);
        });

        Schema::table('payouts', function (Blueprint $table) {
            $table->dropColumn('doku_payout_id');
        });

        // xendit_invoice_id dibiarkan nullable agar rollback tetap jalan bila ada baris NULL.
    }
};
