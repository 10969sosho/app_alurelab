<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * GET /merchant/products
     * List semua produk milik toko aktif dengan filter & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $query = Product::where('tenant_id', $store->id)
            ->with('variants')
            ->orderBy('created_at', 'desc');

        // Filter
        if ($request->filled('search')) {
            $query->where('title', 'ilike', '%'.$request->search.'%');
        }
        if ($request->filled('status')) {
            $status = $request->status;
            if (in_array($status, ['active', 'inactive'], true)) {
                $query->where('is_active', $status === 'active');
            } elseif ($status === 'action_required') {
                // Perlu tindakan: tidak ada varian yang masih punya stok
                $query->whereDoesntHave('variants', fn ($v) => $v->where('stock', '>', 0));
            } elseif ($status === 'review') {
                // Sedang ditinjau: data belum lengkap (deskripsi atau gambar kosong)
                $query->where(function ($outer) {
                    $outer->where(function ($q) {
                        $q->whereNull('description')->orWhere('description', '');
                    })->orWhere(function ($q) {
                        $q->whereNull('images')->orWhere('images', '[]');
                    });
                });
            }
        }
        if ($request->filled('category')) {
            $query->where('category_name', $request->category);
        }
        if ($request->input('low_stock') === 'true') {
            $query->whereHas('variants', fn ($v) => $v->where('stock', '<', 5));
        }

        $products = $query->paginate($request->input('per_page', 20));

        return response()->json($products);
    }

    /**
     * POST /merchant/products
     * Buat produk baru.
     */
    public function store(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_name' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'weight_grams' => 'required|integer|min:1',
            'images' => 'nullable|array',
            'images.*' => 'url',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'tags' => 'nullable|array',
            // Varian (opsional)
            'variants' => 'nullable|array',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.title' => 'required_with:variants|string|max:150',
            'variants.*.price' => 'required_with:variants|numeric|min:0',
            'variants.*.stock' => 'required_with:variants|integer|min:0',
            'variants.*.weight_grams' => 'nullable|integer|min:1',
            'stock' => 'nullable|integer|min:0',
        ];

        if (empty($request->input('variants'))) {
            $rules['stock'] = 'required|integer|min:0';
        }

        $validated = $request->validate($rules);

        $product = DB::transaction(function () use ($store, $validated): Product {
            $product = Product::create([
                'tenant_id' => $store->id,
                'title' => $validated['title'],
                'slug' => $this->uniqueSlug($store->id, $validated['title']),
                'description' => $validated['description'] ?? null,
                'category_name' => $validated['category_name'] ?? null,
                'price' => $validated['price'],
                'compare_at_price' => $validated['compare_at_price'] ?? null,
                'cost_price' => $validated['cost_price'] ?? null,
                'weight_grams' => $validated['weight_grams'],
                'images' => $validated['images'] ?? [],
                'is_active' => $validated['is_active'] ?? true,
                'settings' => [
                    'meta_title' => $validated['meta_title'] ?? null,
                    'meta_description' => $validated['meta_description'] ?? null,
                    'tags' => $validated['tags'] ?? [],
                ],
            ]);

            foreach ($validated['variants'] ?? [] as $variantData) {
                ProductVariant::create([
                    'tenant_id' => $store->id,
                    'product_id' => $product->id,
                    'sku' => $variantData['sku'] ?? strtoupper(Str::random(8)),
                    'title' => $variantData['title'],
                    'price' => $variantData['price'],
                    'stock' => $variantData['stock'],
                    'weight_grams' => $variantData['weight_grams'] ?? $validated['weight_grams'],
                ]);
            }

            if (empty($validated['variants'])) {
                ProductVariant::create([
                    'tenant_id' => $store->id,
                    'product_id' => $product->id,
                    'sku' => strtoupper(Str::random(8)),
                    'title' => 'Standard',
                    'price' => $product->price,
                    'stock' => $validated['stock'],
                ]);
            }

            return $product;
        });

        return response()->json(
            $product->load('variants'),
            201
        );
    }

    /**
     * GET /merchant/products/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $product = Product::where('tenant_id', $store->id)
            ->with('variants')
            ->findOrFail($id);

        return response()->json($product);
    }

    /**
     * PUT /merchant/products/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $product = Product::where('tenant_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category_name' => 'nullable|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'weight_grams' => 'sometimes|integer|min:1',
            'images' => 'nullable|array',
            'images.*' => 'url',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'tags' => 'nullable|array',
            'variants' => 'nullable|array',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.title' => 'required_with:variants|string|max:150',
            'variants.*.price' => 'required_with:variants|numeric|min:0',
            'variants.*.stock' => 'required_with:variants|integer|min:0',
            'variants.*.weight_grams' => 'nullable|integer|min:1',
            'stock' => 'sometimes|integer|min:0',
        ]);

        // Merge settings jika ada
        if (isset($validated['meta_title']) || isset($validated['meta_description']) || isset($validated['tags'])) {
            $currentSettings = $product->settings ?? [];
            $validated['settings'] = array_merge($currentSettings, [
                'meta_title' => $validated['meta_title'] ?? ($currentSettings['meta_title'] ?? null),
                'meta_description' => $validated['meta_description'] ?? ($currentSettings['meta_description'] ?? null),
                'tags' => $validated['tags'] ?? ($currentSettings['tags'] ?? []),
            ]);
            unset($validated['meta_title'], $validated['meta_description'], $validated['tags']);
        }

        $variantsData = $validated['variants'] ?? null;
        unset($validated['variants'], $validated['stock']);

        DB::transaction(function () use ($product, $store, $validated, $variantsData, $request): void {
            if (isset($validated['title']) && $validated['title'] !== $product->title) {
                $validated['slug'] = $this->uniqueSlug($store->id, $validated['title'], $product->id);
            }

            $product->update($validated);

            if ($variantsData !== null) {
                ProductVariant::where('product_id', $product->id)->delete();

                foreach ($variantsData as $variantData) {
                    ProductVariant::create([
                        'tenant_id' => $store->id,
                        'product_id' => $product->id,
                        'sku' => $variantData['sku'] ?? strtoupper(Str::random(8)),
                        'title' => $variantData['title'],
                        'price' => $variantData['price'],
                        'stock' => $variantData['stock'],
                        'weight_grams' => $variantData['weight_grams'] ?? $product->weight_grams,
                    ]);
                }

                if ($variantsData === []) {
                    ProductVariant::create([
                        'tenant_id' => $store->id,
                        'product_id' => $product->id,
                        'sku' => strtoupper(Str::random(8)),
                        'title' => 'Standard',
                        'price' => $product->price,
                        'stock' => $request->integer('stock', 0),
                    ]);
                }
            } elseif ($product->variants()->count() === 0) {
                ProductVariant::create([
                    'tenant_id' => $store->id,
                    'product_id' => $product->id,
                    'sku' => strtoupper(Str::random(8)),
                    'title' => 'Standard',
                    'price' => $product->price,
                    'stock' => 100,
                ]);
            }
        });

        return response()->json($product->load('variants'));
    }

    /**
     * DELETE /merchant/products/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $product = Product::where('tenant_id', $store->id)->findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }

    /**
     * PATCH /merchant/products/{id}/toggle-status
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $product = Product::where('tenant_id', $store->id)->findOrFail($id);
        $product->update(['is_active' => ! $product->is_active]);

        return response()->json([
            'message' => $product->is_active ? 'Produk diaktifkan.' : 'Produk dinon-aktifkan.',
            'is_active' => $product->is_active,
        ]);
    }

    // ─── Variant Management ───────────────────────────────────────────────────

    /**
     * GET /merchant/products/{id}/variants
     */
    public function variants(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $product = Product::where('tenant_id', $store->id)->findOrFail($id);
        $variants = $product->variants()->orderBy('created_at')->get();

        return response()->json($variants);
    }

    /**
     * POST /merchant/products/{id}/variants
     */
    public function storeVariant(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $product = Product::where('tenant_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'sku' => 'nullable|string|max:100',
            'title' => 'required|string|max:150',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'weight_grams' => 'nullable|integer|min:1',
        ]);

        $variant = ProductVariant::create([
            'tenant_id' => $store->id,
            'product_id' => $product->id,
            ...$validated,
            'weight_grams' => $validated['weight_grams'] ?? $product->weight_grams,
        ]);

        return response()->json($variant, 201);
    }

    /**
     * PUT /merchant/products/{id}/variants/{variantId}
     */
    public function updateVariant(Request $request, string $id, string $variantId): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $variant = ProductVariant::where('tenant_id', $store->id)
            ->where('product_id', $id)
            ->findOrFail($variantId);

        $validated = $request->validate([
            'sku' => 'nullable|string|max:100',
            'title' => 'sometimes|string|max:150',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'weight_grams' => 'nullable|integer|min:1',
        ]);

        $variant->update($validated);

        return response()->json($variant);
    }

    /**
     * DELETE /merchant/products/{id}/variants/{variantId}
     */
    public function destroyVariant(Request $request, string $id, string $variantId): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $variant = ProductVariant::where('tenant_id', $store->id)
            ->where('product_id', $id)
            ->findOrFail($variantId);
        $variant->delete();

        return response()->json(['message' => 'Varian berhasil dihapus.']);
    }

    /**
     * POST /merchant/products/bulk
     * Bulk action: activate/deactivate/delete multiple products.
     */
    public function bulk(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'uuid',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        $query = Product::where('tenant_id', $store->id)->whereIn('id', $validated['ids']);

        match ($validated['action']) {
            'activate' => $query->update(['is_active' => true]),
            'deactivate' => $query->update(['is_active' => false]),
            'delete' => $query->delete(),
        };

        return response()->json(['message' => 'Aksi berhasil dijalankan pada '.count($validated['ids']).' produk.']);
    }

    private function uniqueSlug(string $tenantId, string $title, ?string $exceptProductId = null): string
    {
        $baseSlug = Str::slug($title) ?: 'product';
        $slug = $baseSlug;
        $counter = 1;

        while (Product::where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->when($exceptProductId, fn ($query) => $query->where('id', '!=', $exceptProductId))
            ->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        return $slug;
    }
}
