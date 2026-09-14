<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Aktifkan UUID extensions (PostgreSQL)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        }

        // ─── STORES (Tenants) ─────────────────────────────────────────────────
        Schema::create('stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug', 100)->unique();
            $table->string('custom_domain')->unique()->nullable();
            $table->string('custom_domain_status', 50)->default('pending');
            $table->string('xendit_sub_account_id', 100)->unique()->nullable();
            $table->string('xendit_account_status', 50)->default('unregistered');
            $table->string('plan_tier', 50)->default('starter');
            $table->timestampTz('plan_expires_at')->nullable();
            $table->text('logo_url')->nullable();
            $table->string('phone_number', 30);
            $table->string('address_area_id', 100)->nullable();
            $table->text('address_detail')->nullable();
            $table->jsonb('settings')->default('{}');
            $table->timestampsTz();
        });

        // ─── STORE_USERS (RBAC Join Table) ────────────────────────────────────
        Schema::create('store_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role', 50)->default('owner');
            $table->timestampTz('created_at')->useCurrent();
            $table->unique(['store_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_users');
        Schema::dropIfExists('stores');
    }
};
