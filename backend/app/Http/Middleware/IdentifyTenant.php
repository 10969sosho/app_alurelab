<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\Store;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request and set up PostgreSQL RLS context.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->header('x-forwarded-host') ?: $request->getHost();
        $rootDomain = config('app.root_domain', 'alurelab.shop');

        // Boleh override lewat header atau route parameter untuk development & API testing
        $explicitStoreId = $request->header('x-tenant-id')
            ?: $request->header('x-store-slug')
            ?: $request->route('store_slug');

        $store = null;

        if ($explicitStoreId) {
            $storeId = Cache::remember("tenant:id_by_slug_or_id:{$explicitStoreId}", 86400, function () use ($explicitStoreId) {
                if (Str::isUuid($explicitStoreId)) {
                    return Store::where('id', $explicitStoreId)->value('id');
                }
                return Store::where('slug', $explicitStoreId)->value('id');
            });

            if ($storeId) {
                $store = Store::find($storeId);
            }
        }

        // Jika request dari user terautentikasi (misal di Dashboard) dan belum ada store
        if (!$store && $request->user()) {
            $store = $request->user()->stores()->first();
        }

        if (!$store) {
            // Resolusi Subdomain vs Custom Domain
            $cacheKey = "domain:{$host}";
            $storeId = Cache::get($cacheKey);

            if ($storeId) {
                $store = Store::find($storeId);
            } else {
                if (str_ends_with($host, $rootDomain)) {
                    // Contoh: amanda.alurelab.shop -> subdomain = amanda
                    $subdomain = str_replace(".{$rootDomain}", '', $host);
                    $store = Store::where('slug', $subdomain)->first();
                } else {
                    // Custom Domain (tokoku.com)
                    $store = Store::where('custom_domain', $host)
                        ->where('custom_domain_status', 'active')
                        ->first();
                }

                if ($store) {
                    Cache::put($cacheKey, $store->id, 86400); // 24 Jam
                }
            }
        }

        if (!$store) {
            return response()->json([
                'error' => 'TenantNotFound',
                'message' => 'Toko tidak ditemukan atau domain belum dikonfigurasi.',
                'host' => $host,
            ], 404);
        }

        // Kunci isolasi data di level PostgreSQL kernel (Row Level Security)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET LOCAL app.current_tenant_id = '{$store->id}';");
        }

        // Ikat instance Store ke Service Container & request attribute
        app()->instance('current_tenant', $store);
        app()->instance('current_store', $store);
        $request->attributes->set('tenant', $store);
        $request->attributes->set('current_store', $store);

        return $next($request);
    }
}
