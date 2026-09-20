<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * GET /v1/admin/stats
     * Platform-wide statistics.
     */
    public function stats(): JsonResponse
    {
        $today = now()->startOfDay();

        return response()->json([
            'data' => [
                'total_sellers'     => Store::count(),
                'total_buyers'      => Customer::count(),
                'total_orders'      => Order::count(),
                'gmv'               => Order::whereIn('status', ['completed', 'delivered'])->sum('total_amount'),
                'new_sellers_today' => Store::where('created_at', '>=', $today)->count(),
                'new_buyers_today'  => Customer::where('created_at', '>=', $today)->count(),
            ],
        ]);
    }

    /**
     * GET /v1/admin/sellers
     * List all stores (sellers) with owner info.
     */
    public function sellers(Request $request): JsonResponse
    {
        $stores = Store::with(['storeUsers.user'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $search) =>
                $q->where(fn ($q2) =>
                    $q2->where('name', 'ilike', "%{$search}%")
                       ->orWhereHas('storeUsers.user', fn ($q3) =>
                           $q3->where('email', 'ilike', "%{$search}%")
                              ->orWhere('name', 'ilike', "%{$search}%")
                       )
                )
            )
            ->orderByDesc('created_at')
            ->paginate(20);

        $transformed = $stores->through(function ($store) {
            $owner = $store->storeUsers->first()?->user;
            return [
                'id'           => $store->id,
                'store_name'   => $store->name,
                'slug'         => $store->slug,
                'owner_name'   => $owner?->name ?? '-',
                'email'        => $owner?->email ?? '-',
                'status'       => $store->status ?? 'active',
                'plan'         => $store->plan_tier ?? 'Free',
                'orders_count' => $store->orders()->count(),
                'created_at'   => $store->created_at,
            ];
        });

        return response()->json($transformed);
    }

    /**
     * GET /v1/admin/sellers/{id}
     * Single seller detail.
     */
    public function sellerDetail(string $id): JsonResponse
    {
        $store = Store::with(['storeUsers.user'])->findOrFail($id);
        $owner = $store->storeUsers->first()?->user;

        return response()->json([
            'data' => [
                'id'             => $store->id,
                'store_name'     => $store->name,
                'slug'           => $store->slug,
                'owner_name'     => $owner?->name,
                'email'          => $owner?->email,
                'phone'          => $owner?->phone_number,
                'status'         => $store->status ?? 'active',
                'plan'           => $store->plan_tier ?? 'Free',
                'description'    => $store->description,
                'products_count' => $store->products()->count(),
                'orders_count'   => $store->orders()->count(),
                'revenue'        => $store->orders()->whereIn('status', ['completed', 'delivered'])->sum('total_amount'),
                'created_at'     => $store->created_at,
            ],
        ]);
    }

    /**
     * GET /v1/admin/buyers
     * List all customers (buyers).
     */
    public function buyers(Request $request): JsonResponse
    {
        $buyers = Customer::when($request->search, fn ($q, $search) =>
                $q->where(fn ($q2) =>
                    $q2->where('full_name', 'ilike', "%{$search}%")
                       ->orWhere('email', 'ilike', "%{$search}%")
                       ->orWhere('phone_number', 'like', "%{$search}%")
                )
            )
            ->orderByDesc('created_at')
            ->paginate(20);

        $transformed = $buyers->through(function ($buyer) {
            return [
                'id'           => $buyer->id,
                'full_name'    => $buyer->full_name,
                'email'        => $buyer->email,
                'phone_number' => $buyer->phone_number,
                'total_orders' => $buyer->orders()->count(),
                'total_spent'  => $buyer->orders()->whereIn('status', ['completed', 'delivered'])->sum('total_amount'),
                'last_active'  => $buyer->updated_at,
                'created_at'   => $buyer->created_at,
            ];
        });

        return response()->json($transformed);
    }

    /**
     * GET /v1/admin/buyers/{id}
     * Single buyer detail with order history.
     */
    public function buyerDetail(string $id): JsonResponse
    {
        $buyer = Customer::findOrFail($id);

        $orders = $buyer->orders()
            ->with('store')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($o) => [
                'id'     => $o->order_number,
                'store'  => $o->store?->name,
                'amount' => $o->total_amount,
                'status' => $o->status,
                'date'   => $o->created_at,
            ]);

        return response()->json([
            'data' => [
                'id'           => $buyer->id,
                'full_name'    => $buyer->full_name,
                'email'        => $buyer->email,
                'phone_number' => $buyer->phone_number,
                'total_orders' => $buyer->orders()->count(),
                'total_spent'  => $buyer->orders()->whereIn('status', ['completed', 'delivered'])->sum('total_amount'),
                'last_active'  => $buyer->updated_at,
                'created_at'   => $buyer->created_at,
                'orders'       => $orders,
            ],
        ]);
    }
}
