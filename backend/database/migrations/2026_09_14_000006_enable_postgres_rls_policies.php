<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // RLS adalah fitur khusus PostgreSQL kernel-level
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'products',
            'product_variants',
            'orders',
            'order_items',
            'payments',
            'shipments',
            'wallet_transactions',
            'payouts',
        ];

        foreach ($tables as $table) {
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;");
            DB::statement("ALTER TABLE {$table} FORCE ROW LEVEL SECURITY;");
            
            // Buat isolasi policy: izinkan jika app.current_tenant_id sesuai atau bypass jika superadmin
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies 
                        WHERE tablename = '{$table}' AND policyname = 'tenant_isolation_{$table}'
                    ) THEN
                        CREATE POLICY tenant_isolation_{$table} ON {$table}
                            FOR ALL 
                            USING (
                                COALESCE(current_setting('app.is_system_bypass', true), 'off') = 'on'
                                OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                            );
                    END IF;
                END
                $$;
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'products',
            'product_variants',
            'orders',
            'order_items',
            'payments',
            'shipments',
            'wallet_transactions',
            'payouts',
        ];

        foreach ($tables as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_{$table} ON {$table};");
            DB::statement("ALTER TABLE {$table} NO FORCE ROW LEVEL SECURITY;");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;");
        }
    }
};
