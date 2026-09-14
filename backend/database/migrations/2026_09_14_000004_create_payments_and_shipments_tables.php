<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->foreignUuid('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('xendit_invoice_id', 100)->unique();
            $table->string('payment_method', 50); // QRIS, VIRTUAL_ACCOUNT, EWALLET, COD
            $table->string('payment_channel', 50)->nullable(); // BCA, MANDIRI, GOPAY, SHOPEEPAY
            $table->decimal('amount', 15, 2);
            $table->decimal('gateway_fee', 15, 2)->default(0);
            $table->string('status', 50)->default('PENDING'); // PENDING, PAID, EXPIRED, REFUNDED
            $table->timestampTz('paid_at')->nullable();
            $table->jsonb('raw_webhook_payload')->nullable();
            $table->timestampsTz();

            $table->index('tenant_id');
            $table->index('order_id');
            $table->index('status');
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->foreignUuid('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('biteship_order_id', 100)->unique()->nullable();
            $table->string('courier_code', 50); // sicepat, jne, jnt, anteraja
            $table->string('courier_service', 50); // reg, best, ez
            $table->string('waybill_id', 100)->nullable(); // Nomor Resi AWB
            $table->string('tracking_status', 50)->default('allocated');
            $table->text('shipping_label_url')->nullable(); // Thermal PDF A6 (100x150 mm)
            $table->boolean('is_cod')->default(false);
            $table->decimal('cod_amount', 15, 2)->default(0);
            $table->timestampTz('shipped_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampsTz();

            $table->index('tenant_id');
            $table->index('order_id');
            $table->index('waybill_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('payments');
    }
};
