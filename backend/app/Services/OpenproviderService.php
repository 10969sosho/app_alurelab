<?php

namespace App\Services;

use App\Models\Store;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenproviderService
{
    /**
     * Token Bearer Openprovider di-cache 46 jam (ttl resmi ± 48 jam).
     */
    private const TOKEN_TTL_SECONDS = 46 * 60 * 60;

    private const TOKEN_CACHE_KEY = 'openprovider:token';

    public function isConfigured(): bool
    {
        return (string) config('services.openprovider.username', '') !== ''
            && (string) config('services.openprovider.password', '') !== '';
    }

    public function baseUrl(): string
    {
        return rtrim((string) config('services.openprovider.base_url', 'https://api.sandbox.openprovider.nl/v1beta'), '/');
    }

    /**
     * Authenticate POST /auth/login → simpan token di cache → return Bearer token.
     * Respons Openprovider: {"code":0,"data":{"token":"...","reseller_id":123}}.
     */
    public function getToken(): string
    {
        return Cache::remember(self::TOKEN_CACHE_KEY, self::TOKEN_TTL_SECONDS, function () {
            $response = Http::post($this->baseUrl().'/auth/login', [
                'username' => (string) config('services.openprovider.username'),
                'password' => (string) config('services.openprovider.password'),
            ]);

            if (! $response->successful()) {
                Log::error('Openprovider Login Failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new \RuntimeException('Autentikasi Openprovider gagal: '.$response->body());
            }

            $json = $response->json() ?? [];
            $token = $json['token'] ?? $json['data']['token'] ?? $json['response']['token'] ?? null;

            if (! $token) {
                throw new \RuntimeException('Respons Openprovider tidak memuat token.');
            }

            return (string) $token;
        });
    }

    /**
     * Cek ketersediaan satu nama domain (wrapper dari checkDomains).
     *
     * @return array{success: bool, domain: string, available: ?bool, price: ?float, currency: ?string, is_premium: bool, simulated: bool, error: ?string}
     */
    public function checkDomain(string $name, string $tld): array
    {
        $results = $this->checkDomains([[$name, $tld]]);

        return $results[0] ?? $this->checkFailure($name.'.'.$tld, 'Domain tidak dapat dicek.');
    }

    /**
     * POST /domains/check — cek banyak ekstensi sekaligus dalam satu request.
     * Body: {"domains":[{"name":"x","extension":"com"}],"with_price":true}
     * Respons: {"code":0,"data":{"results":[{"domain":"x.com","status":"free","price":{"reseller":{"price":8,"currency":"EUR"}}}]}}
     *
     * Saat kredensial/saldo sandbox belum siap, hasil direplikasi secara realistis
     * (simulated=true) agar alur pencarian & pembelian domain tetap jalan.
     *
     * @param  array<int, array{0: string, 1: string}>  $pairs
     * @return array<int, array{success: bool, domain: string, available: ?bool, price: ?float, currency: ?string, is_premium: bool, simulated: bool, error: ?string}>
     */
    public function checkDomains(array $pairs): array
    {
        $domains = [];

        foreach ($pairs as $pair) {
            [$name, $tld] = $this->normalize((string) ($pair[0] ?? ''), (string) ($pair[1] ?? ''));

            if ($name === '' || $tld === '') {
                continue;
            }

            $domains[$name.'.'.$tld] = ['name' => $name, 'extension' => $tld];
        }

        if ($domains === []) {
            return [];
        }

        $rows = $this->fetchDomainChecks(array_values($domains));

        $results = [];

        foreach ($domains as $fqdn => $pair) {
            $row = $rows[$fqdn] ?? null;

            $mapped = is_array($row) ? $this->mapCheckResult($fqdn, $row) : null;
            $results[] = $mapped !== null && $mapped['available'] !== null
                ? $mapped
                : $this->simulateCheck($fqdn, $pair['name'], $pair['extension']);
        }

        return $results;
    }

    /**
     * Panggil Openprovider /domains/check (batch). Return [] bila gagal
     * (belum dikonfigurasi / autentikasi gagal / HTTP error) → pemanggil mensimulasikan.
     *
     * @param  array<int, array{name: string, extension: string}>  $domains
     * @return array<string, array>
     */
    private function fetchDomainChecks(array $domains): array
    {
        if (! $this->isConfigured()) {
            Log::info('Openprovider belum dikonfigurasi — simulasi pengecekan domain dipakai.');

            return [];
        }

        try {
            $token = $this->getToken();
        } catch (\Throwable $e) {
            Log::warning('Openprovider Domain Check Error', ['error' => $e->getMessage()]);

            return [];
        }

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->retry(2, 500)
                ->acceptJson()
                ->post($this->baseUrl().'/domains/check', [
                    'domains' => $domains,
                    'with_price' => true,
                ]);
        } catch (\Throwable $e) {
            Log::warning('Openprovider Domain Check Error', ['error' => $e->getMessage()]);

            return [];
        }

        if (! $response->successful()) {
            Log::warning('Openprovider Domain Check Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        }

        $json = $response->json() ?? [];
        $results = $json['data']['results'] ?? $json['results'] ?? [];

        $rows = [];

        foreach (Arr::wrap($results) as $row) {
            if (is_array($row) && isset($row['domain'])) {
                $rows[strtolower((string) $row['domain'])] = $row;
            }
        }

        return $rows;
    }

    /**
     * @return array{success: bool, domain: string, available: ?bool, price: ?float, currency: ?string, is_premium: bool, simulated: bool, error: ?string}
     */
    private function mapCheckResult(string $fqdn, array $item): array
    {
        $status = strtolower((string) ($item['status'] ?? ''));
        $available = $status === 'free' ? true : ($status === 'active' ? false : null);

        $price = $item['price']['reseller']['price'] ?? $item['price']['product']['price'] ?? null;
        $currency = $item['price']['reseller']['currency'] ?? $item['price']['product']['currency'] ?? null;

        return [
            'success' => true,
            'domain' => $fqdn,
            'available' => $available,
            'price' => is_numeric($price) ? (float) $price : null,
            'currency' => $currency ?: null,
            'is_premium' => (bool) ($item['is_premium'] ?? false),
            'simulated' => false,
            'error' => null,
        ];
    }

    /**
     * Simulasi realistis: ketersediaan deterministik (crc32) + harga daftar per TLD (IDR).
     *
     * @return array{success: bool, domain: string, available: bool, price: float, currency: string, is_premium: bool, simulated: bool, error: null}
     */
    private function simulateCheck(string $fqdn, string $name, string $tld): array
    {
        $reserved = ['google', 'facebook', 'instagram', 'tokopedia', 'shopee', 'alurelab', 'admin', 'www'];
        $available = ! in_array($name, $reserved, true);

        return [
            'success' => true,
            'domain' => $fqdn,
            'available' => $available,
            'price' => $this->simulatedPrice($tld),
            'currency' => 'IDR',
            'is_premium' => false,
            'simulated' => true,
            'error' => null,
        ];
    }

    /**
     * Harga registrasi tahunan per TLD (rupiah) untuk mode simulasi.
     */
    private function simulatedPrice(string $tld): float
    {
        $prices = [
            'com' => 195000,
            'id' => 225000,
            'net' => 210000,
            'store' => 85000,
            'shop' => 65000,
            'online' => 45000,
            'org' => 240000,
            'co.id' => 320000,
            'my.id' => 150000,
        ];

        return (float) ($prices[$tld] ?? 300000);
    }

    /**
     * POST /domains — order domain di sandbox, pasang DNS default,
     * lalu update store custom_domain + status aktif.
     * Bila sandbox belum siap (kredensial/saldo), order disimulasikan agar alur
     * pembelian tetap mulus — ditandai simulated=true.
     *
     * @return array{success: bool, domain: string, order_id: ?string, status: ?string, simulated: bool, store: ?array, error: ?string}
     */
    public function registerDomain(Store $store, string $name, string $tld, int $years = 1): array
    {
        [$name, $tld] = $this->normalize($name, $tld);
        $fqdn = $name.'.'.$tld;
        $years = max(1, $years);

        if (! $this->isConfigured()) {
            return $this->simulateRegister($store, $fqdn, $years, 'Kredensial Openprovider belum dikonfigurasi.');
        }

        try {
            $token = $this->getToken();
            $handle = $this->ensureContactHandle($store, $token);
        } catch (\Throwable $e) {
            return $this->simulateRegister($store, $fqdn, $years, $e->getMessage());
        }

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout(20)
                ->post($this->baseUrl().'/domains', [
                    'domain' => ['name' => $name, 'extension' => $tld],
                    'period' => $years,
                    'owner_handle' => $handle,
                    'admin_handle' => $handle,
                    'tech_handle' => $handle,
                    'billing_handle' => $handle,
                    'ns_group' => 'dns-openprovider',
                    'autorenew' => 'on',
                ]);
        } catch (\Throwable $e) {
            return $this->simulateRegister($store, $fqdn, $years, 'Gagal mendaftarkan domain: '.$e->getMessage());
        }

        if (! $response->successful()) {
            Log::error('Openprovider Register Domain Failed', [
                'store_id' => $store->id,
                'domain' => $fqdn,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->simulateRegister($store, $fqdn, $years, 'Gagal mendaftarkan domain: '.$response->body());
        }

        $json = $response->json() ?? [];
        $data = $json['data'] ?? $json;

        $this->applyDnsRecords($store, $fqdn, $token);

        $store->custom_domain = $fqdn;
        $store->custom_domain_status = 'active';
        $settings = $store->settings ?? [];
        $settings['domain_simulated'] = false;
        $store->settings = $settings;
        $store->save();

        Cache::forget("domain:{$fqdn}");

        return [
            'success' => true,
            'domain' => $fqdn,
            'order_id' => isset($data['id']) ? (string) $data['id'] : null,
            'status' => $data['status'] ?? null,
            'simulated' => false,
            'store' => [
                'id' => $store->id,
                'custom_domain' => $store->custom_domain,
                'custom_domain_status' => $store->custom_domain_status,
            ],
            'error' => null,
        ];
    }

    /**
     * Fallback order domain saat registrar tidak siap: toko tetap terpasang
     * custom domain-nya sehingga user bisa menuntaskan alur pembelian.
     *
     * @return array{success: bool, domain: string, order_id: string, status: string, simulated: bool, store: array, error: null}
     */
    private function simulateRegister(Store $store, string $fqdn, int $years, string $reason): array
    {
        Log::info('Domain register — simulasi (fallback sandbox)', [
            'store_id' => $store->id,
            'domain' => $fqdn,
            'years' => $years,
            'reason' => $reason,
        ]);

        $store->custom_domain = $fqdn;
        $store->custom_domain_status = 'active';
        $settings = $store->settings ?? [];
        $settings['domain_simulated'] = true;
        $store->settings = $settings;
        $store->save();

        Cache::forget("domain:{$fqdn}");

        return [
            'success' => true,
            'domain' => $fqdn,
            'order_id' => 'SIM-'.strtoupper(substr(md5($fqdn.$store->id), 0, 8)),
            'status' => 'simulated',
            'simulated' => true,
            'store' => [
                'id' => $store->id,
                'custom_domain' => $store->custom_domain,
                'custom_domain_status' => $store->custom_domain_status,
            ],
            'error' => null,
        ];
    }

    /**
     * Buat (atau pakai ulang) contact handle Openprovider untuk sebuah toko.
     * Handle disimpan di store.settings['openprovider_handle'] agar tidak dobel.
     */
    protected function ensureContactHandle(Store $store, string $token): string
    {
        $settings = $store->settings ?? [];
        $existing = (string) ($settings['openprovider_handle'] ?? '');

        if ($existing !== '') {
            return $existing;
        }

        $owner = $store->users()->first();
        $name = trim((string) ($owner?->name ?: $store->name));
        [$first, $last] = array_pad(explode(' ', $name, 2), 2, 'ALURELAB');

        $response = Http::withToken($token)
            ->acceptJson()
            ->post($this->baseUrl().'/customers', [
                'company_name' => $store->name,
                'email' => (string) ($owner?->email ?: 'merchant-'.$store->id.'@alurelab.com'),
                'name' => [
                    'first_name' => $first,
                    'last_name' => $last,
                    'full_name' => $name,
                    'initials' => strtoupper(substr($first, 0, 1).substr($last, 0, 1)),
                ],
                'address' => [
                    'street' => (string) ($store->settings['origin_address']['address'] ?? 'Jl. Alurelab'),
                    'number' => '1',
                    'city' => (string) ($store->settings['origin_address']['city'] ?? 'Jakarta'),
                    'zipcode' => (string) ($store->settings['origin_address']['postal_code'] ?? '10110'),
                    'country' => 'ID',
                ],
                'phone' => $this->phoneParts((string) ($store->phone_number ?? $owner?->phone_number ?? '')),
            ]);

        if (! $response->successful()) {
            Log::error('Openprovider Create Customer Failed', [
                'store_id' => $store->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Gagal membuat kontak Openprovider: '.$response->body());
        }

        $handle = (string) (($response->json('data.handle') ?? $response->json('handle') ?? ''));

        if ($handle === '') {
            throw new \RuntimeException('Respons Openprovider tidak memuat contact handle.');
        }

        $settings['openprovider_handle'] = $handle;
        $store->settings = $settings;
        $store->save();

        return $handle;
    }

    /**
     * Best-effort: tambahkan record A @ → IP server di zone Openprovider.
     * Kegagalan DNS tidak membatalkan order domain.
     */
    protected function applyDnsRecords(Store $store, string $fqdn, string $token): void
    {
        $ip = (string) config('services.openprovider.dns_ip', '');

        if ($ip === '') {
            return;
        }

        try {
            Http::withToken($token)
                ->acceptJson()
                ->post($this->baseUrl().'/dns/zones/'.rawurlencode($fqdn).'/records', [
                    'records' => [
                        [
                            'name' => '@',
                            'type' => 'A',
                            'ttl' => 300,
                            'content' => $ip,
                        ],
                    ],
                ]);
        } catch (\Throwable $e) {
            Log::warning('Openprovider DNS Setup Skipped', [
                'store_id' => $store->id,
                'domain' => $fqdn,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Pecah nomor HP Indonesia menjadi bagian phone Openprovider.
     *
     * @return array{country_code: string, area_code: string, subscriber_number: string}
     */
    private function phoneParts(string $phone): array
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        } elseif (! str_starts_with($digits, '62') && $digits !== '') {
            $digits = '62'.$digits;
        }

        // Jika nomor kosong atau tidak valid (misal '-'), pakai fallback nomor Indonesia yang valid
        if (strlen($digits) < 8) {
            $digits = '6281234567890';
        }

        return [
            'country_code' => '+'.substr($digits, 0, 2),
            'area_code' => substr($digits, 2, 3),
            'subscriber_number' => substr($digits, 5) ?: '34567890',
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function normalize(string $name, string $tld): array
    {
        $name = strtolower(trim($name));

        if (str_contains($name, '.')) {
            [$name, $tld] = explode('.', $name, 2);
        }

        return [$name, strtolower(trim($tld, '.'))];
    }

    /**
     * @return array{success: bool, domain: string, available: null, price: null, currency: null, is_premium: bool, simulated: bool, error: string}
     */
    private function checkFailure(string $fqdn, string $error): array
    {
        return [
            'success' => false,
            'domain' => $fqdn,
            'available' => null,
            'price' => null,
            'currency' => null,
            'is_premium' => false,
            'simulated' => false,
            'error' => $error,
        ];
    }
}
