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
     * POST /domains/check — cek ketersediaan nama domain.
     * Body: {"domains":[{"name":"x","extension":"com"}],"with_price":true}
     * Respons: {"code":0,"data":{"results":[{"domain":"x.com","status":"free","price":{"reseller":{"price":8,"currency":"EUR"}}}]}}
     *
     * @return array{success: bool, domain: string, available: ?bool, price: ?float, currency: ?string, is_premium: bool, error: ?string}
     */
    public function checkDomain(string $name, string $tld): array
    {
        [$name, $tld] = $this->normalize($name, $tld);
        $fqdn = $name.'.'.$tld;

        if (! $this->isConfigured()) {
            return $this->checkFailure($fqdn, 'Kredensial Openprovider belum dikonfigurasi.');
        }

        try {
            $token = $this->getToken();
        } catch (\Throwable $e) {
            return $this->checkFailure($fqdn, $e->getMessage());
        }

        $response = Http::withToken($token)
            ->timeout(15)
            ->retry(2, 500)
            ->acceptJson()
            ->post($this->baseUrl().'/domains/check', [
                'domains' => [['name' => $name, 'extension' => $tld]],
                'with_price' => true,
            ]);

        if (! $response->successful()) {
            Log::warning('Openprovider Domain Check Failed', [
                'domain' => $fqdn,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->checkFailure($fqdn, 'Gagal mengecek domain: '.$response->body());
        }

        $json = $response->json() ?? [];
        $results = $json['data']['results'] ?? $json['results'] ?? [];
        $item = collect(Arr::wrap($results))
            ->first(fn ($row) => is_array($row) && strtolower((string) ($row['domain'] ?? '')) === strtolower($fqdn))
            ?? (is_array($results) ? (Arr::first($results) ?? []) : []);

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
            'error' => null,
        ];
    }

    /**
     * POST /domains — order domain di sandbox, pasang DNS default,
     * lalu update store custom_domain + status aktif.
     *
     * @return array{success: bool, domain: string, order_id: ?string, status: ?string, store: ?array, error: ?string}
     */
    public function registerDomain(Store $store, string $name, string $tld, int $years = 1): array
    {
        [$name, $tld] = $this->normalize($name, $tld);
        $fqdn = $name.'.'.$tld;
        $years = max(1, $years);

        if (! $this->isConfigured()) {
            return $this->registerFailure($fqdn, 'Kredensial Openprovider belum dikonfigurasi.');
        }

        try {
            $token = $this->getToken();
            $handle = $this->ensureContactHandle($store, $token);
        } catch (\Throwable $e) {
            return $this->registerFailure($fqdn, $e->getMessage());
        }

        $response = Http::withToken($token)
            ->acceptJson()
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

        if (! $response->successful()) {
            Log::error('Openprovider Register Domain Failed', [
                'store_id' => $store->id,
                'domain' => $fqdn,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->registerFailure($fqdn, 'Gagal mendaftarkan domain: '.$response->body());
        }

        $json = $response->json() ?? [];
        $data = $json['data'] ?? $json;

        $this->applyDnsRecords($store, $fqdn, $token);

        $store->custom_domain = $fqdn;
        $store->custom_domain_status = 'active';
        $store->save();

        Cache::forget("domain:{$fqdn}");

        return [
            'success' => true,
            'domain' => $fqdn,
            'order_id' => isset($data['id']) ? (string) $data['id'] : null,
            'status' => $data['status'] ?? null,
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
                'email' => (string) ($owner?->email ?: 'merchant-'.$store->id.'@alurelab.shop'),
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
     * @return array{success: bool, domain: string, available: null, price: null, currency: null, is_premium: bool, error: string}
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
            'error' => $error,
        ];
    }

    /**
     * @return array{success: bool, domain: string, order_id: null, status: null, store: null, error: string}
     */
    private function registerFailure(string $fqdn, string $error): array
    {
        return [
            'success' => false,
            'domain' => $fqdn,
            'order_id' => null,
            'status' => null,
            'store' => null,
            'error' => $error,
        ];
    }
}
