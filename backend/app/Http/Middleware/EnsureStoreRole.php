<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStoreRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $store = $request->attributes->get('current_store');

        if (! $user || ! $store) {
            return response()->json(['message' => 'Akses tenant tidak valid.'], 403);
        }

        if (! $user->is_superadmin) {
            $membership = $user->stores()->whereKey($store->id)->first();
            if (! $membership || ! in_array($membership->pivot->role, $roles, true)) {
                return response()->json(['message' => 'Role Anda tidak memiliki akses ke aksi ini.'], 403);
            }
        }

        return $next($request);
    }
}
