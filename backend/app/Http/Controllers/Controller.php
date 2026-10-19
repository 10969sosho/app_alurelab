<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Resolusi aman Store / Tenant aktif dari konteks request.
     */
    protected function resolveCurrentStore(Request $request): ?Store
    {
        if (app()->bound('current_tenant')) {
            $store = app('current_tenant');
            if ($store instanceof Store) {
                return $store;
            }
        }

        if (app()->bound('current_store')) {
            $store = app('current_store');
            if ($store instanceof Store) {
                return $store;
            }
        }

        if ($request->attributes->has('current_store')) {
            $store = $request->attributes->get('current_store');
            if ($store instanceof Store) {
                return $store;
            }
        }

        if ($request->attributes->has('tenant')) {
            $store = $request->attributes->get('tenant');
            if ($store instanceof Store) {
                return $store;
            }
        }

        $user = $request->user();
        if ($user && method_exists($user, 'stores')) {
            return $user->stores()->first();
        }

        return null;
    }
}
