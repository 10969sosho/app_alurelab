<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('stores')->onDelete('restrict');
            $table->foreignUuid('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignUuid('variant_id')->constrained('product_variants')->onDelete('restrict');
            $table->unsignedInteger('quantity');
            $table->string('status', 20)->default('held');
            $table->timestampTz('expires_at');
            $table->timestampTz('released_at')->nullable();
            $table->timestampTz('consumed_at')->nullable();
            $table->timestampsTz();

            $table->index(['status', 'expires_at']);
            $table->index(['order_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY');
            DB::statement('ALTER TABLE inventory_reservations FORCE ROW LEVEL SECURITY');
            DB::statement(<<<'SQL'
                CREATE POLICY tenant_isolation_inventory_reservations ON inventory_reservations
                FOR ALL
                USING (
                    COALESCE(current_setting('app.is_system_bypass', true), 'off') = 'on'
                    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                )
                SQL);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_inventory_reservations ON inventory_reservations');
            DB::statement('ALTER TABLE inventory_reservations NO FORCE ROW LEVEL SECURITY');
            DB::statement('ALTER TABLE inventory_reservations DISABLE ROW LEVEL SECURITY');
        }

        Schema::dropIfExists('inventory_reservations');
    }
};
