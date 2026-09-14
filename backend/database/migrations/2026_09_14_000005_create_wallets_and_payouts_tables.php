<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->unique()->constrained('stores')->onDelete('restrict');
            $table->decimal('available_balance', 15, 2)->default(0.00); // Siap dicairkan
            $table->decimal('escrow_held_balance', 15, 2)->default(0.00); // Tertahan selama pengiriman
            $table->timestampsTz();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->foreignUuid('wallet_id')->constrained('merchant_wallets');
            $table->foreignUuid('order_id')->nullable()->constrained('orders');
            $table->string('type', 50); // ORDER_ESCROW_CREDIT, ESCROW_RELEASED, WITHDRAWAL, REFUND_DEBIT
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->text('description');
            $table->string('idempotency_key', 150)->unique(); // Cegah double-credit
            $table->timestampsTz();

            $table->index('tenant_id');
            $table->index('wallet_id');
            $table->index('type');
        });

        Schema::create('payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->string('xendit_disbursement_id', 100)->unique()->nullable();
            $table->string('bank_code', 50); // BCA, MANDIRI, BRI, BNI
            $table->string('account_number', 50);
            $table->string('account_holder_name');
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(3000.00); // Fee flat XenDisburse Rp 3.000
            $table->string('status', 50)->default('PENDING'); // PENDING, COMPLETED, FAILED
            $table->timestampTz('processed_at')->nullable();
            $table->timestampsTz();

            $table->index('tenant_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('merchant_wallets');
    }
};
