<?php

namespace Tests\Feature;

use App\Models\MerchantWallet;
use App\Models\Payout;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class SellerFlowSetupTest extends TestCase
{
    private User $user;

    private array $authHeaders;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Seller Flow',
            'email' => 'seller.flow.'.Str::random(8).'@example.com',
            'phone_number' => '081'.rand(10000000, 99999999),
            'password_hash' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $token = $this->user->createToken('dashboard', ['role:owner'])->plainTextToken;

        $this->authHeaders = ['Authorization' => 'Bearer '.$token];
    }

    private function configureDoku(): void
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'doku.base_url' => 'https://api-sandbox.doku.com',
        ]);
    }

    private function createStoreForUser(User $user, array $settings = []): Store
    {
        $store = Store::create([
            'name' => 'Seller Store '.Str::random(5),
            'slug' => 'seller-store-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
            'settings' => $settings,
        ]);

        StoreUser::create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);

        return $store;
    }

    public function test_store_database_default_plan_is_free(): void
    {
        $store = Store::create([
            'name' => 'Free Plan Store',
            'slug' => 'free-plan-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
        ]);

        $this->assertSame('free', $store->fresh()->plan_tier);
    }

    // ─── POST /stores ────────────────────────────────────────────────────────

    public function test_authenticated_user_can_create_store(): void
    {
        $this->configureDoku();
        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => fn () => throw new ConnectionException('timeout'),
        ]);

        $slug = 'kopi-senja-'.Str::lower(Str::random(6));

        $res = $this->withHeaders($this->authHeaders)->postJson('/api/v1/stores', [
            'name' => 'Kopi Senja',
            'slug' => $slug,
            'category' => 'Makanan & Minuman',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('store.name', 'Kopi Senja')
            ->assertJsonPath('store.slug', $slug);

        $store = Store::where('slug', $slug)->first();
        $this->assertNotNull($store);
        $this->assertSame('free', $store->plan_tier);
        $this->assertSame('default', $store->settings['template']);
        $this->assertSame('default', $store->settings['theme']);
        $this->assertSame('active', $store->settings['status']);
        $this->assertSame('Makanan & Minuman', $store->settings['business_category']);

        $this->assertTrue($store->users()->where('user_id', $this->user->id)->exists());
        $this->assertSame('owner', $store->users()->first()->pivot->role);

        $this->assertDatabaseHas('merchant_wallets', [
            'store_id' => $store->id,
            'available_balance' => 0,
        ]);
    }

    public function test_create_store_requires_authentication(): void
    {
        $this->postJson('/api/v1/stores', ['name' => 'No Auth Store', 'slug' => 'no-auth-'.Str::lower(Str::random(6))])
            ->assertStatus(401);
    }

    public function test_create_store_rejects_short_name_and_duplicate_slug(): void
    {
        $taken = $this->createStoreForUser($this->user);

        $this->withHeaders($this->authHeaders)
            ->postJson('/api/v1/stores', ['name' => 'ab', 'slug' => 'short-name-'.Str::lower(Str::random(6))])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        $this->withHeaders($this->authHeaders)
            ->postJson('/api/v1/stores', ['name' => 'Nama Cukup Panjang', 'slug' => $taken->slug])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_settings_reject_incomplete_bank_account_and_save_complete_details(): void
    {
        $store = $this->createStoreForUser($this->user);
        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        $this->withHeaders($headers)
            ->putJson('/api/v1/merchant/settings', [
                'settings' => [
                    'bank_account' => [
                        'bank_name' => 'BCA',
                        'account_number' => '',
                        'account_holder' => '',
                    ],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'settings.bank_account.account_number',
                'settings.bank_account.account_holder',
            ]);

        $this->assertArrayNotHasKey('bank_account', $store->fresh()->settings ?? []);

        $this->withHeaders($headers)
            ->putJson('/api/v1/merchant/settings', [
                'settings' => [
                    'bank_account' => [
                        'bank_name' => 'BCA',
                        'account_number' => '1234567890',
                        'account_holder' => 'Cristian Test',
                    ],
                ],
            ])
            ->assertOk();

        $bankAccount = $store->fresh()->settings['bank_account'];
        $this->assertSame('BCA', $bankAccount['bank_name']);
        $this->assertSame('1234567890', $bankAccount['account_number']);
        $this->assertSame('Cristian Test', $bankAccount['account_holder']);
    }

    public function test_settings_save_address_without_bank_details(): void
    {
        $store = $this->createStoreForUser($this->user);
        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        $this->withHeaders($headers)
            ->putJson('/api/v1/merchant/settings', [
                'name' => $store->name,
                'phone_number' => $store->phone_number,
                'settings' => [
                    'origin_address' => [
                        'contact_name' => 'Seller Store',
                        'phone' => '081334999789',
                        'address' => 'Jl. Makmur RT 02/RW 03',
                        'province' => 'Jawa Timur',
                        'city' => 'Kabupaten Blitar',
                        'district' => 'Nglegok',
                        'village' => 'Nglegok',
                        'province_code' => '35',
                        'regency_code' => '35.05',
                        'district_code' => '35.05.09',
                        'village_code' => '35.05.09.1009',
                        'area_id' => 'ID_ID_3505_350509',
                        'area_name' => 'Nglegok',
                        'postal_code' => '66181',
                    ],
                    'couriers' => ['jne', 'sicepat', 'jnt', 'anteraja'],
                    'allow_cod' => true,
                ],
            ])
            ->assertOk();

        $this->assertSame('ID_ID_3505_350509', $store->fresh()->address_area_id);
        $this->assertArrayNotHasKey('bank_account', $store->fresh()->settings ?? []);
    }

    // ─── GET /merchant/setup-guide ───────────────────────────────────────────

    public function test_setup_guide_reports_five_pillars_and_progress(): void
    {
        $store = $this->createStoreForUser($this->user, [
            'template' => 'editorial',
            'allow_cod' => true,
        ]);
        $store->update([
            'doku_sub_account_id' => 'ACC-GUIDE-1',
            'address_area_id' => 'jkt-001',
        ]);

        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        $res = $this->withHeaders($headers)->getJson('/api/v1/merchant/setup-guide');

        $res->assertStatus(200)
            ->assertJsonPath('total', 5)
            ->assertJsonPath('steps.design_chosen', true)
            ->assertJsonPath('steps.payments_configured', true)
            ->assertJsonPath('steps.shipping_configured', true)
            ->assertJsonPath('steps.products_added', false)
            ->assertJsonPath('steps.domain_connected', false)
            ->assertJsonPath('completed', 3);

        $this->assertSame(60, $res->json('percent'));
    }

    public function test_setup_guide_marks_products_and_domain_when_present(): void
    {
        $store = $this->createStoreForUser($this->user, ['theme' => 'noir']);
        $store->update([
            'custom_domain' => 'kopisenja.com',
            'custom_domain_status' => 'active',
        ]);
        $store->products()->create([
            'tenant_id' => $store->id,
            'title' => 'Kopi Arabika',
            'slug' => 'kopi-arabika-'.Str::lower(Str::random(6)),
            'price' => 50000,
            'is_active' => true,
        ]);

        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        $this->withHeaders($headers)
            ->getJson('/api/v1/merchant/setup-guide')
            ->assertStatus(200)
            ->assertJsonPath('steps.products_added', true)
            ->assertJsonPath('steps.domain_connected', true)
            ->assertJsonPath('steps.payments_configured', false)
            ->assertJsonPath('completed', 3);
    }

    // ─── Promotions (dinonaktifkan 503 sebelumnya) ───────────────────────────

    public function test_promotions_crud_is_no_longer_blocked(): void
    {
        $store = $this->createStoreForUser($this->user);
        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        $this->withHeaders($headers)->getJson('/api/v1/merchant/promotions')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $created = $this->withHeaders($headers)->postJson('/api/v1/merchant/promotions', [
            'name' => 'Diskon Gajian',
            'code' => 'gajian10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_spend' => 50000,
            'quota' => 100,
        ]);

        $created->assertStatus(200)->assertJsonPath('success', true);

        $promoId = $created->json('data.id');
        $this->assertSame('GAJIAN10', $created->json('data.code'));

        $this->withHeaders($headers)->getJson('/api/v1/merchant/promotions')
            ->assertStatus(200)
            ->assertJsonPath('data.0.id', $promoId);

        $this->withHeaders($headers)->deleteJson('/api/v1/merchant/promotions/'.$promoId)
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->withHeaders($headers)->getJson('/api/v1/merchant/promotions')
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }

    // ─── Payout (dinonaktifkan 503 sebelumnya) ───────────────────────────────

    public function test_payout_requires_minimum_balance_and_bank_account(): void
    {
        $store = $this->createStoreForUser($this->user);
        MerchantWallet::create([
            'store_id' => $store->id,
            'available_balance' => 100000,
            'escrow_held_balance' => 0,
        ]);

        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        // Tanpa rekening bank
        $this->withHeaders($headers)
            ->postJson('/api/v1/merchant/finance/withdraw', ['amount' => 60000])
            ->assertStatus(422);

        // Di bawah minimum Rp 50.000
        $this->withHeaders($headers)
            ->postJson('/api/v1/merchant/finance/withdraw', [
                'amount' => 20000,
                'bank_code' => 'BCA',
                'account_number' => '1234567890',
                'account_holder_name' => 'Seller Flow',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertSame(0, Payout::where('tenant_id', $store->id)->count());
    }

    public function test_payout_creates_pending_record_when_valid(): void
    {
        $store = $this->createStoreForUser($this->user, [
            'bank_account' => [
                'bank_code' => 'BCA',
                'account_number' => '1234567890',
                'account_holder' => 'Seller Flow',
            ],
        ]);
        MerchantWallet::create([
            'store_id' => $store->id,
            'available_balance' => 100000,
            'escrow_held_balance' => 0,
        ]);

        $headers = array_merge($this->authHeaders, ['X-Store-Slug' => $store->slug]);

        $res = $this->withHeaders($headers)
            ->postJson('/api/v1/merchant/finance/withdraw', ['amount' => 75000]);

        $res->assertStatus(201)->assertJsonPath('success', true);

        $payout = Payout::where('tenant_id', $store->id)->first();
        $this->assertNotNull($payout);
        $this->assertSame('PENDING', $payout->status);
        $this->assertSame('BCA', $payout->bank_code);
        $this->assertSame('1234567890', $payout->account_number);
        $this->assertEquals(75000, (int) $payout->amount);
    }
}
