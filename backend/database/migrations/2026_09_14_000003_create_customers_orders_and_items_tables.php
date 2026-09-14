<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone_number', 30)->unique(); // Kunci global cross-tenant
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->jsonb('default_address')->default('{}');
            
            // Riwayat Anti-RTS Akumulasi Lintas Toko
            $table->integer('total_orders')->default(0);
            $table->integer('completed_orders')->default(0);
            $table->integer('rts_rejected_orders')->default(0);
            $table->decimal('risk_score', 5, 2)->default(0.00); // 0-100 (Skor tinggi = bahaya COD)
            $table->boolean('is_blacklisted')->default(false);
            
            $table->timestampsTz();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->string('order_number', 60)->unique(); // ORD-20260914-XXXX
            $table->foreignUuid('customer_id')->constrained('customers');
            
            // State Machine Status
            $table->string('status', 50)->default('pending_payment');
            // pending_payment, paid_escrow, cod_verified, processing, shipped, delivered, completed, cancelled, rts_returned

            // Financial Snapshot
            $table->decimal('items_subtotal', 15, 2);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('insurance_cost', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            
            // Monetisasi Platform ALURELAB
            $table->decimal('platform_fee_percent', 5, 2)->default(1.50);
            $table->decimal('platform_fee_amount', 15, 2);
            $table->decimal('merchant_net_amount', 15, 2);
            
            // Alamat & Penerima Kiriman
            $table->string('shipping_recipient_name');
            $table->string('shipping_recipient_phone', 30);
            $table->string('shipping_destination_area_id', 100);
            $table->text('shipping_address_detail');
            $table->text('shipping_notes')->nullable();
            
            $table->timestampsTz();

            $table->index('tenant_id');
            $table->index('status');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->foreignUuid('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            
            $table->string('product_title');
            $table->string('variant_title', 150)->nullable();
            $table->decimal('price', 15, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 15, 2);

            $table->index('tenant_id');
            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('customers');
    }
};
