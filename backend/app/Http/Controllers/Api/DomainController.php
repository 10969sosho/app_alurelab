<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\OpenproviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DomainController extends Controller
{
    /**
     * TLD utama yang ditawarkan sebagai rekomendasi pencarian domain.
     *
     * @var array<int, string>
     */
    private const SUGGESTED_TLDS = ['com', 'id', 'store', 'shop'];

    /**
     * Ekstensi tambahan yang ditampilkan pada bagian "Other extensions".
     *
     * @var array<int, string>
     */
    private const OTHER_TLDS = ['online', 'net'];

    public function __construct(
        protected OpenproviderService $openprovider
    ) {}

    /**
     * GET /merchant/domains — daftar domain toko (subdomain utama + custom domain).
     */
    public function index(Request $request): JsonResponse
    {
        $store = $this->resolveStore($request);

        if (! $store) {
            return response()->json([
                'success' => false,
                'error' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $rootDomain = (string) config('app.root_domain', 'alurelab.com');
        $settings = $store->settings ?? [];
        $customDomain = $store->custom_domain;
        $customActive = $store->custom_domain_status === 'active';

        $domains = [
            [
                'domain' => $store->slug.'.'.$rootDomain,
                'type' => 'subdomain',
                'label' => 'Subdomain ALURELAB',
                'status' => 'active',
                'is_primary' => true,
                'dns' => true,
                'ssl' => true,
                'simulated' => false,
            ],
        ];

        if ($customDomain) {
            $domains[] = [
                'domain' => $customDomain,
                'type' => 'custom',
                'label' => 'Custom domain',
                'status' => $store->custom_domain_status,
                'is_primary' => false,
                'dns' => $customActive,
                'ssl' => $customActive,
                'simulated' => (bool) ($settings['domain_simulated'] ?? false),
            ];
        }

        return response()->json([
            'success' => true,
            'root_domain' => $rootDomain,
            'dns_records' => $this->dnsRecords(),
            'primary' => $domains[0],
            'custom' => $customDomain ? $domains[1] : null,
            'domains' => $domains,
        ]);
    }

    /**
     * POST /merchant/domain/check — cek ketersediaan + saran TLD lain.
     * Nama boleh berupa "tokoku" maupun "tokoku.com".
     */
    public function check(Request $request): JsonResponse
    {
        [$name, $tld] = $this->parseDomainInput($request);

        $primaryTld = $tld ?: 'com';
        $pairs = [[$name, $primaryTld]];

        foreach (array_merge(self::SUGGESTED_TLDS, self::OTHER_TLDS) as $extension) {
            if ($extension !== $primaryTld) {
                $pairs[] = [$name, $extension];
            }
        }

        try {
            $results = $this->openprovider->checkDomains($pairs);
        } catch (\Throwable $e) {
            report($e);
            $results = [];
        }

        $resultByDomain = collect($results)->keyBy('domain');
        $suggestions = [];
        $primary = null;

        foreach ($pairs as [$pairName, $extension]) {
            $domain = $pairName.'.'.$extension;
            $result = $resultByDomain->get($domain) ?? $this->fallbackDomainResult($domain, $extension);
            $isSuggested = in_array($extension, self::SUGGESTED_TLDS, true);
            $result['name'] = $name;
            $result['tld'] = $extension;
            $result['is_suggested'] = $isSuggested;
            $result['group'] = $isSuggested ? 'suggested' : 'other';
            $suggestions[] = $result;

            if ($extension === $primaryTld) {
                $primary = $result;
            }
        }

        return response()->json([
            'success' => true,
            'name' => $name,
            'tld' => $primaryTld,
            'domain' => $primary['domain'],
            'available' => $primary['available'],
            'price' => $primary['price'],
            'currency' => $primary['currency'],
            'is_premium' => $primary['is_premium'],
            'simulated' => (bool) ($primary['simulated'] ?? false),
            'error' => null,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * POST /merchant/domain/register — order domain & aktifkan custom domain toko.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $this->validateDomainPayload($request);
        $store = $this->resolveStore($request);

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
     * PUT /merchant/domain/connect — pasang domain milik sendiri & cek DNS-nya.
     */
    public function connect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
        ], [
            'domain.required' => 'Domain wajib diisi.',
        ]);

        $store = $this->resolveStore($request);

        if (! $store) {
            return response()->json([
                'success' => false,
                'error' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $domain = $this->sanitizeFqdn($validated['domain']);

        if (! $domain) {
            return response()->json([
                'success' => false,
                'error' => 'Format domain tidak valid. Contoh: tokoku.com',
            ], 422);
        }

        $rootDomain = (string) config('app.root_domain', 'alurelab.com');

        if ($domain === $store->slug.'.'.$rootDomain) {
            return response()->json([
                'success' => false,
                'error' => 'Domain tidak boleh sama dengan subdomain toko.',
            ], 422);
        }

        $status = $this->verifyDns($domain, $rootDomain);

        $store->custom_domain = $domain;
        $store->custom_domain_status = $status;
        $settings = $store->settings ?? [];
        unset($settings['domain_simulated']);
        $store->settings = $settings;
        $store->save();

        Cache::forget("domain:{$domain}");

        return response()->json([
            'success' => true,
            'domain' => $domain,
            'status' => $status,
            'dns' => $status === 'active',
            'ssl' => $status === 'active',
            'dns_records' => $this->dnsRecords(),
            'store' => [
                'id' => $store->id,
                'custom_domain' => $store->custom_domain,
                'custom_domain_status' => $store->custom_domain_status,
            ],
            'error' => null,
        ]);
    }

    /**
     * @return array{name: string, tld: string}
     */
    private function validateDomainPayload(Request $request): array
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'tld' => 'nullable|string|max:24|regex:/^[a-z0-9.-]+$/i',
            'years' => 'nullable|integer|min:1|max:10',
        ], [
            'name.required' => 'Nama domain wajib diisi.',
            'tld.regex' => 'Ekstensi domain tidak valid.',
        ]);

        [$name, $tld] = $this->parseDomainInput($request);

        return [
            'name' => $name,
            'tld' => $tld ?: 'com',
        ];
    }

    /**
     * Ambil nama domain dari input. "tokoku.com" dipisah otomatis menjadi
     * name=tokoku, tld=com; bila tidak ada titik, tld memakai nilai request.
     *
     * @return array{0: string, 1: string}
     */
    private function parseDomainInput(Request $request): array
    {
        $rawInput = $request->input('query', $request->input('name', $request->input('domain', 'domain')));
        $input = is_string($rawInput) || is_numeric($rawInput) ? strtolower(trim((string) $rawInput)) : '';
        $input = preg_replace('#^https?://#', '', $input) ?? $input;
        $input = explode('/', $input)[0];
        $input = preg_replace('/[^a-z0-9.-]/', '', $input) ?? '';
        $input = preg_replace('/^www\./', '', $input) ?? $input;
        $rawTld = $request->input('tld', '');
        $explicitTld = is_string($rawTld) ? strtolower(trim($rawTld, '.')) : '';

        if (str_contains($input, '.')) {
            [$name, $tld] = explode('.', $input, 2);
        } else {
            $name = $input;
            $tld = $explicitTld;
        }

        $name = trim(preg_replace('/[^a-z0-9-]/', '', $name) ?? '', '-');
        $name = substr($name, 0, 63) ?: 'domain';
        $tld = strtolower(trim($tld, '.'));

        if (! in_array($tld, array_merge(self::SUGGESTED_TLDS, self::OTHER_TLDS), true)) {
            $tld = 'com';
        }

        return [$name, $tld];
    }

    /**
     * @return array{success: bool, domain: string, available: bool, price: int, currency: string, is_premium: bool, simulated: bool, error: null}
     */
    private function fallbackDomainResult(string $domain, string $tld): array
    {
        $prices = [
            'com' => 195000,
            'id' => 225000,
            'store' => 85000,
            'shop' => 65000,
            'online' => 45000,
            'net' => 210000,
        ];

        return [
            'success' => true,
            'domain' => $domain,
            'available' => true,
            'price' => $prices[$tld] ?? $prices['com'],
            'currency' => 'IDR',
            'is_premium' => false,
            'simulated' => true,
            'error' => null,
        ];
    }

    private function hasValidSegments(string $value): bool
    {
        foreach (explode('.', $value) as $segment) {
            if (! preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $segment)) {
                return false;
            }
        }

        return true;
    }

    private function sanitizeFqdn(string $domain): string
    {
        $domain = strtolower(trim($domain));
        $domain = preg_replace('#^https?://#', '', $domain) ?? $domain;
        $domain = explode('/', $domain)[0];
        $domain = preg_replace('/[^a-z0-9.-]/', '', $domain) ?? '';
        $domain = rtrim($domain, '.');

        return str_contains($domain, '.') && $this->hasValidSegments($domain) ? $domain : '';
    }

    /**
     * Status DNS: aktif bila domain sudah menunjuk ke server ALURELAB.
     */
    private function verifyDns(string $fqdn, string $rootDomain): string
    {
        $expected = [(string) (config('services.openprovider.dns_ip') ?: '103.121.122.135')];

        $rootIp = (string) gethostbyname($rootDomain);

        if ($rootIp !== '' && $rootIp !== $rootDomain) {
            $expected[] = $rootIp;
        }

        $cnameIp = (string) gethostbyname('cname.alurelab.com');

        if ($cnameIp !== '' && $cnameIp !== 'cname.alurelab.com') {
            $expected[] = $cnameIp;
        }

        if ($expected === []) {
            return 'pending';
        }

        $resolved = @gethostbynamel($fqdn) ?: [];

        return array_intersect($resolved, $expected) !== [] ? 'active' : 'pending';
    }

    /**
     * @return array<int, array{type: string, name: string, value: string}>
     */
    private function dnsRecords(): array
    {
        return [
            [
                'type' => 'A',
                'name' => '@',
                'value' => (string) (config('services.openprovider.dns_ip') ?: '103.121.122.135'),
            ],
            [
                'type' => 'CNAME',
                'name' => 'www',
                'value' => 'cname.alurelab.com',
            ],
        ];
    }

    private function resolveStore(Request $request): ?Store
    {
        /** @var Store|null $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store') ?? $request->user()?->stores()->first();

        return $store;
    }
}
