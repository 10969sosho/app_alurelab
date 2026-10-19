<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\OpenproviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    public function __construct(
        protected OpenproviderService $openprovider
    ) {}

    /**
     * POST /merchant/domain/check — cek ketersediaan domain via Openprovider Sandbox.
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $this->validateDomainPayload($request);

        $result = $this->openprovider->checkDomain($validated['name'], $validated['tld']);

        return response()->json($result, $result['success'] ? 200 : 502);
    }

    /**
     * POST /merchant/domain/register — order domain & aktifkan custom domain toko.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $this->validateDomainPayload($request);

        /** @var Store|null $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store') ?? $request->user()?->stores()->first();

        if (! $store) {
            return response()->json([
                'success' => false,
                'error' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $years = max(1, (int) $request->input('years', 1));

        $result = $this->openprovider->registerDomain($store, $validated['name'], $validated['tld'], $years);

        return response()->json($result, $result['success'] ? 200 : 502);
    }

    /**
     * @return array{name: string, tld: string}
     */
    private function validateDomainPayload(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tld' => 'required|string|max:24|regex:/^[a-z0-9.-]+$/i',
            'years' => 'nullable|integer|min:1|max:10',
        ], [
            'name.required' => 'Nama domain wajib diisi.',
            'tld.regex' => 'Ekstensi domain tidak valid.',
        ]);

        $name = strtolower(trim($validated['name']));
        $name = preg_replace('/[^a-z0-9.-]/', '', $name) ?? '';

        $segments = explode('.', $name);

        foreach ($segments as $segment) {
            if (! preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $segment)) {
                abort(response()->json([
                    'success' => false,
                    'error' => 'Format nama domain tidak valid. Gunakan huruf, angka, dan tanda minus saja.',
                ], 422));
            }
        }

        return [
            'name' => $name,
            'tld' => strtolower(trim($validated['tld'], '.')),
        ];
    }
}
