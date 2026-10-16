<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('phone_verified')->default(false);
        });

        Schema::create('buyer_kycs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('customer_id')->unique()->constrained('customers')->cascadeOnDelete();
            $table->string('full_name');
            $table->text('ktp_number');
            $table->string('ktp_image');
            $table->string('selfie_image');
            $table->string('status', 20)->default('pending');
            $table->timestampTz('verified_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestampsTz();
        });

        Schema::create('buyer_bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('customer_id')->unique()->constrained('customers')->cascadeOnDelete();
            $table->string('bank_name', 100);
            $table->text('account_number');
            $table->string('account_holder_name');
            $table->timestampsTz();
        });

        Schema::create('buyer_refund_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('tenant_id')->constrained('stores')->restrictOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('type', 20);
            $table->text('reason');
            $table->decimal('amount', 15, 2);
            $table->string('status', 20)->default('pending');
            $table->string('bank_name', 100);
            $table->text('account_number');
            $table->string('account_holder_name');
            $table->timestampTz('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestampsTz();

            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buyer_refund_requests');
        Schema::dropIfExists('buyer_bank_accounts');
        Schema::dropIfExists('buyer_kycs');
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('phone_verified');
        });
    }
};
