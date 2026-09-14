<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Aktifkan UUID extensions jika di PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        }

        Schema::create('stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug', 100)->unique();
            $table->string('custom_domain')->unique()->nullable();
            $table->string('custom_domain_status', 50)->default('pending'); // pending, active, error
            
            // Xendit XenPlatform Sub-Account
            $table->string('xendit_sub_account_id', 100)->unique()->nullable();
            $table->string('xendit_account_status', 50)->default('unregistered'); // active, suspended, unregistered
            
            // Subscription Tier
            $table->string('plan_tier', 50)->default('starter'); // starter, pro, business
            $table->timestampTz('plan_expires_at')->nullable();
            
            // Profil & Kontak Toko
            $table->text('logo_url')->nullable();
            $table->string('phone_number', 30);
            $table->string('address_area_id', 100)->nullable(); // Biteship Area ID Origin
            $table->text('address_detail')->nullable();
            $table->jsonb('settings')->default('{}');
            
            $table->timestampsTz();

            $table->index('slug');
            $table->index('custom_domain');
        });

        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone_number', 30)->unique();
            $table->string('password');
            $table->boolean('is_superadmin')->default(false);
            $table->rememberToken();
            $table->timestampsTz();
        });

        Schema::create('store_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role', 50)->default('owner'); // owner, manager, staff_order
            $table->timestampsTz();

            $table->unique(['store_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_users');
        Schema::dropIfExists('users');
        Schema::dropIfExists('stores');
    }
};
