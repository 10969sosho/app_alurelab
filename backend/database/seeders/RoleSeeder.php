<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat permissions dasar
        $permissions = [
            'view-dashboard',
            'manage-products',
            'manage-orders',
            'manage-shipping',
            'manage-finance',
            'manage-settings',
            'manage-team',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Roles
        $owner = Role::firstOrCreate(['name' => 'owner']);
        $owner->syncPermissions($permissions);

        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
            'view-dashboard',
            'manage-products',
            'manage-orders',
            'manage-shipping',
            'manage-settings',
        ]);

        $staff = Role::firstOrCreate(['name' => 'staff_order']);
        $staff->syncPermissions([
            'view-dashboard',
            'manage-orders',
            'manage-shipping',
        ]);
    }
}
