<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Services\DokuService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class DokuServiceTest extends TestCase
{
    private const TARGET = '/checkout/v1/payment';

    private const SUB_ACCOUNT_TARGET = '/sac-merchant/v1/accounts';

    private const VA_TARGET = '/bca-virtual-account/v2/payment-code';

    public function test_create_checkout_invoice_sends_signed_doku_request(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
            'doku.invoice_expiry_minutes' => 1440,
            'services.qa_simulation.enabled' => false,
        ]);

        Http::fake([
            'api-sandbox.doku.com/*' => Http::response([
                'response' => [
                    'order' => ['invoice_number' => 'ORD-20261015-ABC123', 'status' => 'PENDING'],
                    'payment' => ['url' => 'https://sandbox.doku.com/checkout/token123'],
                ],
            ]),
        ]);

        $order = new Order([
            'order_number' => 'ORD-20261015-ABC123',
            'total_amount' => 150000,
            'shipping_recipient_name' => 'Budi Santoso',
            'shipping_recipient_phone' => '08123456789',
        ]);
        $store = new Store([
            'name' => 'Toko Uji',
            'slug' => 'toko-uji',
            'doku_sub_account_id' => 'ACC-TEST',
            'settings' => [
                'bank_account' => [
                    'bank_name' => 'BCA',
                    'account_number' => '1234567890',
                    'account_holder' => 'Pemilik Toko',
                ],
            ],
        ]);

        $result = (new DokuService)->createCheckoutInvoice($order, $store);

        $this->assertTrue($result['success']);
        $this->assertSame('https://sandbox.doku.com/checkout/token123', $result['invoice_url']);
        $this->assertSame('ORD-20261015-ABC123', $result['invoice_id']);
        $this->assertNull($result['error']);

        Http::assertSent(function ($request) {
            $body = (string) $request->body();
            $payload = json_decode($body, true);

            $this->assertSame('POST', $request->method());
            $this->assertSame('https://api-sandbox.doku.com'.self::TARGET, $request->url());
            $this->assertSame('BRN-0287-test', $request->header('Client-Id')[0]);
            $this->assertSame(self::TARGET, $request->header('Request-Target')[0]);

            $this->assertSame('ORD-20261015-ABC123', $payload['order']['invoice_number']);
            $this->assertSame('IDR', $payload['order']['currency']);
            $this->assertSame(150000, $payload['order']['amount']);
            $this->assertNotEmpty($payload['order']['callback_url']);
            $this->assertSame('ACC-TEST', $payload['additional_info']['settlement']['sub_account_id']);
            $this->assertSame('Pemilik Toko', $payload['additional_info']['settlement']['bank']['account_name']);

            $requestId = $request->header('Request-Id')[0];
            $timestamp = $request->header('Request-Timestamp')[0];
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $timestamp);

            $digest = base64_encode(hash('sha256', $body, true));
            $this->assertSame($digest, $request->header('Digest')[0]);

            $expected = 'HMACSHA256='.base64_encode(hash_hmac('sha256', implode("\n", [
                'Client-Id:BRN-0287-test',
                'Request-Id:'.$requestId,
                'Request-Timestamp:'.$timestamp,
                'Request-Target:'.self::TARGET,
                'Digest:'.$digest,
            ]), 'doku-secret-test', true));

            $this->assertSame($expected, $request->header('Signature')[0]);

            return true;
        });
    }

    public function test_create_checkout_invoice_fails_without_credentials(): void
    {
        config([
            'doku.client_id' => '',
            'doku.secret_key' => '',
            'services.qa_simulation.enabled' => false,
        ]);

        Http::fake();

        $result = (new DokuService)->createCheckoutInvoice(
            new Order(['order_number' => 'ORD-1', 'total_amount' => 1000]),
            new Store(['name' => 'Toko', 'slug' => 'toko'])
        );

        $this->assertFalse($result['success']);
        $this->assertNotNull($result['error']);
        Http::assertNothingSent();
    }

    public function test_register_sub_account_persists_id_and_status(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
        ]);

        $accId = 'ACC-'.Str::random(10);
        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => Http::response([
                'response' => [
                    'account' => ['id' => $accId, 'status' => 'ACTIVE'],
                ],
            ]),
        ]);

        $store = Store::create([
            'name' => 'Toko Sub Account',
            'slug' => 'toko-sub-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.rand(10000000, 99999999),
        ]);

        $result = (new DokuService)->registerSubAccount($store, 'owner@example.com', '081234567890');

        $this->assertTrue($result['success']);
        $this->assertSame($accId, $result['sub_account_id']);
        $this->assertNull($result['error']);
        $this->assertSame($accId, $store->fresh()->doku_sub_account_id);
        $this->assertSame('ACTIVE', $store->fresh()->doku_account_status);

        Http::assertSent(function ($request) {
            $payload = json_decode((string) $request->body(), true);

            $this->assertSame('POST', $request->method());
            $this->assertSame('https://api-sandbox.doku.com'.self::SUB_ACCOUNT_TARGET, $request->url());
            $this->assertSame('owner@example.com', $payload['account']['email']);
            $this->assertSame('STANDARD', $payload['account']['type']);
            $this->assertSame('Toko Sub Account', $payload['account']['name']);
            $this->assertNotEmpty($request->header('Signature')[0]);

            return true;
        });
    }

    public function test_register_sub_account_uses_store_owner_real_email_when_not_passed(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
        ]);

        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => Http::response([
                'response' => ['account' => ['id' => 'ACC-REAL-EMAIL', 'status' => 'ACTIVE']],
            ]),
        ]);

        $store = Store::create([
            'name' => 'Toko Email Asli',
            'slug' => 'toko-email-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.rand(10000000, 99999999),
        ]);

        $ownerEmail = 'pemilik.'.Str::lower(Str::random(8)).'@example.com';

        StoreUser::create([
            'store_id' => $store->id,
            'user_id' => User::create([
                'name' => 'Pemilik Toko',
                'email' => $ownerEmail,
                'password_hash' => Hash::make('password123'),
            ])->id,
            'role' => 'owner',
        ]);

        $result = (new DokuService)->registerSubAccount($store);

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) use ($ownerEmail) {
            $payload = json_decode((string) $request->body(), true);

            return $payload['account']['email'] === $ownerEmail;
        });
    }

    public function test_register_sub_account_is_idempotent_when_already_registered(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
        ]);

        Http::fake();

        $existingId = 'ACC-EXISTING-'.Str::random(8);
        $store = Store::create([
            'name' => 'Toko Terdaftar',
            'slug' => 'toko-registered-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.rand(10000000, 99999999),
            'doku_sub_account_id' => $existingId,
            'doku_account_status' => 'ACTIVE',
        ]);

        $result = (new DokuService)->registerSubAccount($store);

        $this->assertTrue($result['success']);
        $this->assertSame($existingId, $result['sub_account_id']);
        Http::assertNothingSent();
    }

    public function test_register_sub_account_fails_on_transport_error(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
        ]);

        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => fn () => throw new ConnectionException('cURL error 28: timeout'),
        ]);

        $store = Store::create([
            'name' => 'Toko Timeout',
            'slug' => 'toko-timeout-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.rand(10000000, 99999999),
        ]);

        $result = (new DokuService)->registerSubAccount($store, 'owner@example.com');

        $this->assertFalse($result['success']);
        $this->assertNull($result['sub_account_id']);
        $this->assertNotNull($result['error']);
        $this->assertNull($store->fresh()->doku_sub_account_id);
        $this->assertSame('unregistered', $store->fresh()->doku_account_status);
    }

    public function test_register_sub_account_fails_without_credentials(): void
    {
        config([
            'doku.client_id' => '',
            'doku.secret_key' => '',
        ]);

        Http::fake();

        $store = Store::create([
            'name' => 'Toko Tanpa Kredensial',
            'slug' => 'toko-nocreds-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.rand(10000000, 99999999),
        ]);

        $result = (new DokuService)->registerSubAccount($store);

        $this->assertFalse($result['success']);
        Http::assertNothingSent();
    }

    public function test_create_direct_va_generates_bca_payment_code(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
            'doku.invoice_expiry_minutes' => 1440,
            'services.qa_simulation.enabled' => false,
        ]);

        Http::fake([
            'api-sandbox.doku.com/bca-virtual-account/*' => Http::response([
                'virtual_account_info' => ['virtual_account_number' => '8801234567890'],
            ]),
        ]);

        $order = new Order([
            'order_number' => 'ORD-20261020-VA001',
            'total_amount' => 250000,
            'shipping_recipient_name' => 'Budi Santoso',
        ]);
        $store = new Store(['name' => 'PECEL mini', 'slug' => 'pecel-mini']);

        $result = (new DokuService)->createDirectVa($order, $store, 'BCA');

        $this->assertTrue($result['success']);
        $this->assertSame('8801234567890', $result['va_number']);
        $this->assertSame('BCA', $result['bank']);
        $this->assertNotNull($result['expired_at']);
        $this->assertNull($result['error']);

        Http::assertSent(function ($request) {
            $payload = json_decode((string) $request->body(), true);

            $this->assertSame('POST', $request->method());
            $this->assertSame('https://api-sandbox.doku.com/bca-virtual-account/v2/payment-code', $request->url());
            $this->assertSame(self::VA_TARGET, $request->header('Request-Target')[0]);
            $this->assertSame('ORD-20261020-VA001', $payload['order']['invoice_number']);
            $this->assertSame(250000, $payload['order']['amount']);
            $this->assertSame(1440, $payload['virtual_account_info']['expired_time']);
            $this->assertSame('PECEL mini', $payload['virtual_account_info']['info1']);
            $this->assertSame('Budi Santoso', $payload['customer']['name']);

            return true;
        });
    }

    public function test_create_direct_va_rejects_unsupported_bank(): void
    {
        config(['services.qa_simulation.enabled' => false]);

        Http::fake();

        $result = (new DokuService)->createDirectVa(
            new Order(['order_number' => 'ORD-1', 'total_amount' => 1000]),
            new Store(['name' => 'Toko', 'slug' => 'toko']),
            'BCA_SYND'
        );

        $this->assertFalse($result['success']);
        $this->assertNull($result['va_number']);
        $this->assertNotNull($result['error']);
        Http::assertNothingSent();
    }
}
