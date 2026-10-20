<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\StoreUser;
use App\Models\Subscription;
use App\Models\User;
use App\Services\DokuService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class SubscriptionCheckoutTest extends TestCase
{
    private const WEBHOOK_TARGET = '/api/v1/webhooks/doku/notification';

    private User $user;

    private Store $store;

    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Subscription Store '.Str::random(5),
            'slug' => 'sub-store-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
            'plan_tier' => 'free',
        ]);

        $this->user = User::create([
            'name' => 'Seller Subscription',
            'email' => 'seller.sub.'.Str::random(8).'@example.com',
            'phone_number' => '082'.rand(10000000, 99999999),
            'password_hash' => Hash::make('password123'),
        ]);

        StoreUser::create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'role' => 'owner',
        ]);

        $token = $this->user->createToken('dashboard', ['role:owner'])->plainTextToken;

        $this->headers = [
            'Authorization' => 'Bearer '.$token,
            'X-Store-Slug' => $this->store->slug,
        ];
    }

    private function configureDoku(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
        ]);
    }

    public function test_plans_returns_catalog_and_active_plan(): void
    {
        $this->withHeaders($this->headers)
            ->getJson('/api/v1/merchant/subscription/plans')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('plans.0.tier', 'starter')
            ->assertJsonPath('plans.1.amount', 249000)
            ->assertJsonPath('active_plan.tier', 'free');
    }

    public function test_checkout_creates_pending_subscription_and_returns_payment_url(): void
    {
        $this->configureDoku();

        Http::fake([
            'api-sandbox.doku.com/checkout/*' => Http::response([
                'response' => [
                    'payment' => ['url' => 'https://sandbox.doku.com/checkout/token-sub-1'],
                ],
            ]),
        ]);

        $res = $this->withHeaders($this->headers)
            ->postJson('/api/v1/merchant/subscription/checkout', ['plan' => 'pro']);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('payment_url', 'https://sandbox.doku.com/checkout/token-sub-1');

        $invoiceNumber = $res->json('invoice_number');
        $this->assertStringStartsWith('SUB-', $invoiceNumber);

        $subscription = Subscription::where('invoice_number', $invoiceNumber)->first();
        $this->assertNotNull($subscription);
        $this->assertSame('pending', $subscription->status);
        $this->assertSame('pro', $subscription->plan_tier);
        $this->assertSame(249000, (int) $subscription->amount);
        $this->assertSame($this->store->id, $subscription->store_id);
        $this->assertSame('https://sandbox.doku.com/checkout/token-sub-1', $subscription->payment_url);

        Http::assertSent(function ($request) {
            $payload = json_decode((string) $request->body(), true);

            return $payload['order']['amount'] === 249000
                && str_starts_with($payload['order']['invoice_number'], 'SUB-')
                && $payload['payment']['payment_due_date'] === 60;
        });
    }

    public function test_free_store_can_upgrade_to_starter(): void
    {
        Http::preventStrayRequests();
        $this->configureDoku();

        Http::fake([
            'api-sandbox.doku.com/checkout/*' => Http::response([
                'response' => ['payment' => ['url' => 'https://sandbox.doku.com/checkout/token-free-upgrade']],
            ]),
        ]);

        $this->withHeaders($this->headers)
            ->postJson('/api/v1/merchant/subscription/checkout', ['plan' => 'starter'])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame('free', $this->store->fresh()->plan_tier);
        $this->assertSame(99000, (int) Subscription::where('store_id', $this->store->id)->firstOrFail()->amount);
    }

    public function test_checkout_rejects_plan_that_is_already_active_or_lower(): void
    {
        $this->store->update(['plan_tier' => 'pro']);

        $this->withHeaders($this->headers)
            ->postJson('/api/v1/merchant/subscription/checkout', ['plan' => 'pro'])
            ->assertStatus(422);

        $this->withHeaders($this->headers)
            ->postJson('/api/v1/merchant/subscription/checkout', ['plan' => 'starter'])
            ->assertStatus(422);

        $this->assertSame(0, Subscription::where('store_id', $this->store->id)->count());
    }

    public function test_doku_webhook_paid_marks_subscription_and_upgrades_store_plan(): void
    {
        $subscription = Subscription::create([
            'store_id' => $this->store->id,
            'plan_tier' => 'business',
            'amount' => 599000,
            'status' => 'pending',
            'invoice_number' => 'SUB-'.now()->format('Ymd').'-'.Str::upper(Str::random(5)),
        ]);

        $content = json_encode([
            'order' => [
                'invoice_number' => $subscription->invoice_number,
                'amount' => 599000,
                'status' => 'PAID',
            ],
        ]);

        $this->callWebhook($content)->assertOk()->assertJson(['status' => 'success']);

        $fresh = $subscription->fresh();
        $this->assertSame('paid', $fresh->status);
        $this->assertNotNull($fresh->paid_at);
        $this->assertTrue($fresh->expires_at->isFuture());
        // 30 hari tepat setelah paid_at (bandingkan relatif, bukan epoch absolut)
        $this->assertEqualsWithDelta(
            $fresh->paid_at->addDays(30)->timestamp,
            $fresh->expires_at->timestamp,
            5
        );

        $store = $this->store->fresh();
        $this->assertSame('business', $store->plan_tier);
        $this->assertNotNull($store->plan_expires_at);

        // Webhook ulang idempoten
        $this->callWebhook($content)->assertOk()->assertJson(['status' => 'already_processed']);
        $this->assertSame(1, Subscription::where('invoice_number', $subscription->invoice_number)->count());
    }

    public function test_doku_webhook_expired_subscription_does_not_upgrade_plan(): void
    {
        $subscription = Subscription::create([
            'store_id' => $this->store->id,
            'plan_tier' => 'pro',
            'amount' => 249000,
            'status' => 'pending',
            'invoice_number' => 'SUB-'.now()->format('Ymd').'-'.Str::upper(Str::random(5)),
        ]);

        $content = json_encode([
            'order' => [
                'invoice_number' => $subscription->invoice_number,
                'amount' => 249000,
                'status' => 'EXPIRED',
            ],
        ]);

        $this->callWebhook($content)->assertOk()->assertJson(['status' => 'success']);

        $this->assertSame('expired', $subscription->fresh()->status);
        $this->assertSame('free', $this->store->fresh()->plan_tier);
    }

    public function test_history_returns_store_subscriptions(): void
    {
        $invoiceNumber = 'SUB-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));

        Subscription::create([
            'store_id' => $this->store->id,
            'plan_tier' => 'pro',
            'amount' => 249000,
            'status' => 'paid',
            'invoice_number' => $invoiceNumber,
            'paid_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);

        $this->withHeaders($this->headers)
            ->getJson('/api/v1/merchant/subscription/history')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('subscriptions.0.invoice_number', $invoiceNumber)
            ->assertJsonPath('subscriptions.0.status', 'paid');
    }

    private function callWebhook(string $content): TestResponse
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
        ]);

        $service = new DokuService;
        $requestId = (string) Str::uuid();
        $timestamp = now()->setTimezone('UTC')->format('Y-m-d\TH:i:s.v\Z');

        return $this->call('POST', self::WEBHOOK_TARGET, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_REQUEST_ID' => $requestId,
            'HTTP_REQUEST_TIMESTAMP' => $timestamp,
            'HTTP_SIGNATURE' => $service->generateSignature($requestId, $timestamp, self::WEBHOOK_TARGET, $content),
        ], $content);
    }
}
