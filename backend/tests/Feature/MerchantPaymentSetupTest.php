<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class MerchantPaymentSetupTest extends TestCase
{
    private User $user;

    private Store $store;

    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Payment Store '.Str::random(5),
            'slug' => 'payment-store-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
        ]);

        $this->user = User::create([
            'name' => 'Seller Payment',
            'email' => 'seller.payment.'.Str::random(8).'@example.com',
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

    public function test_payment_setup_registers_sub_account_and_saves_bank(): void
    {
        $this->configureDoku();

        $accId = 'ACC-SETUP-'.Str::random(8);
        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => Http::response([
                'response' => ['account' => ['id' => $accId, 'status' => 'ACTIVE']],
            ]),
        ]);

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/payment/setup', [
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_holder_name' => 'Seller Payment',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('doku_sub_account_id', $accId)
            ->assertJsonPath('bank_account.bank_code', 'BCA');

        $fresh = $this->store->fresh();
        $this->assertSame($accId, $fresh->doku_sub_account_id);
        $this->assertSame('ACTIVE', $fresh->doku_account_status);
        $this->assertSame('1234567890', $fresh->settings['bank_account']['account_number']);
    }

    public function test_payment_setup_registers_when_doku_fails_but_still_saves_bank(): void
    {
        $this->configureDoku();

        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => fn () => throw new ConnectionException('cURL error 28: timeout'),
        ]);

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/payment/setup', [
            'bank_code' => 'MANDIRI',
            'account_number' => '0987654321',
            'account_holder_name' => 'Seller Payment',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', false)
            ->assertJsonPath('payment_status', 'unregistered')
            ->assertJsonPath('bank_account.bank_code', 'MANDIRI');

        $fresh = $this->store->fresh();
        $this->assertNull($fresh->doku_sub_account_id);
        $this->assertSame('MANDIRI', $fresh->settings['bank_account']['bank_code']);
    }

    public function test_payment_setup_skips_registration_when_already_registered(): void
    {
        $this->configureDoku();

        Http::fake();

        $alreadyId = 'ACC-ALREADY-'.Str::random(8);
        $this->store->update([
            'doku_sub_account_id' => $alreadyId,
            'doku_account_status' => 'ACTIVE',
        ]);

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/payment/setup', []);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('doku_sub_account_id', $alreadyId);

        Http::assertNothingSent();
    }

    public function test_payment_status_returns_sub_account_state(): void
    {
        $statusId = 'ACC-STATUS-'.Str::random(8);
        $this->store->update([
            'doku_sub_account_id' => $statusId,
            'doku_account_status' => 'ACTIVE',
            'settings' => array_merge($this->store->settings ?? [], [
                'bank_account' => ['bank_code' => 'BRI', 'account_number' => '111222333'],
            ]),
        ]);

        $this->withHeaders($this->headers)
            ->getJson('/api/v1/merchant/payment/status')
            ->assertStatus(200)
            ->assertJsonPath('doku_sub_account_id', $statusId)
            ->assertJsonPath('payment_status', 'ACTIVE')
            ->assertJsonPath('bank_account.bank_code', 'BRI');
    }

    public function test_onboard_survives_doku_registration_failure(): void
    {
        $this->configureDoku();

        Http::fake([
            'api-sandbox.doku.com/sac-merchant/*' => fn () => throw new ConnectionException('cURL error 28: timeout'),
        ]);

        $suffix = Str::lower(Str::random(8));

        $res = $this->postJson('/api/v1/merchants/onboard', [
            'store_name' => 'Onboard Store',
            'store_slug' => 'onboard-'.$suffix,
            'owner_name' => 'Owner Onboard',
            'owner_email' => 'owner.onboard.'.$suffix.'@example.com',
            'owner_phone' => '0812'.rand(10000000, 99999999),
            'password' => 'password123',
        ]);

        $res->assertStatus(201)->assertJsonPath('success', true);

        $store = Store::where('slug', 'onboard-'.$suffix)->first();
        $this->assertNotNull($store);
        $this->assertSame('free', $store->plan_tier);
        $this->assertNull($store->doku_sub_account_id);
        $this->assertSame('unregistered', $store->doku_account_status);
    }
}
