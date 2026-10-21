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

class DomainTest extends TestCase
{
    private User $user;

    private Store $store;

    private array $headers;

    private string $suffix;

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = Str::lower(Str::random(8));

        $this->store = Store::create([
            'name' => 'Domain Store '.Str::random(5),
            'slug' => 'domain-store-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
        ]);

        $this->user = User::create([
            'name' => 'Seller Domain',
            'email' => 'seller.domain.'.Str::random(8).'@example.com',
            'phone_number' => '082'.rand(10000000, 99999999),
            'password_hash' => Hash::make('password123'),
        ]);

        StoreUser::create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'role' => 'owner',
        ]);

        $this->headers = [
            'Authorization' => 'Bearer '.$this->user->createToken('dashboard', ['role:owner'])->plainTextToken,
            'X-Store-Slug' => $this->store->slug,
        ];
    }

    public function test_index_returns_primary_subdomain_and_custom_domain(): void
    {
        $custom = 'tokoku-custom-'.$this->suffix.'.com';
        $this->store->custom_domain = $custom;
        $this->store->custom_domain_status = 'active';
        $this->store->save();

        $res = $this->withHeaders($this->headers)->getJson('/api/v1/merchant/domains');

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('primary.type', 'subdomain')
            ->assertJsonPath('primary.status', 'active')
            ->assertJsonPath('custom.domain', $custom)
            ->assertJsonPath('custom.dns', true)
            ->assertJsonPath('custom.ssl', true)
            ->assertJsonCount(2, 'domains');

        $this->assertStringStartsWith($this->store->slug.'.', $res->json('primary.domain'));
    }

    public function test_index_returns_null_custom_domain_when_store_has_none(): void
    {
        $res = $this->withHeaders($this->headers)->getJson('/api/v1/merchant/domains');

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('custom', null)
            ->assertJsonCount(1, 'domains');
    }

    public function test_check_splits_typed_domain_and_returns_tld_suggestions(): void
    {
        Http::fake([
            '*/auth/login' => Http::response(['token' => 'test-token']),
            '*/domains/check' => Http::response([
                'code' => 0,
                'data' => ['results' => [
                    ['domain' => 'tokoku.com', 'status' => 'free', 'price' => ['reseller' => ['price' => 11.98, 'currency' => 'USD']]],
                    ['domain' => 'tokoku.id', 'status' => 'active'],
                ]],
            ]),
        ]);

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/domain/check', [
            'name' => 'tokoku.com',
        ]);

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('name', 'tokoku')
            ->assertJsonPath('tld', 'com')
            ->assertJsonPath('domain', 'tokoku.com')
            ->assertJsonPath('available', true)
            ->assertJsonPath('currency', 'USD')
            ->assertJsonPath('simulated', false);

        $suggestions = $res->json('suggestions');
        $this->assertCount(6, $suggestions);
        $this->assertSame(
            ['com', 'id', 'store', 'shop'],
            array_column(array_filter($suggestions, fn ($s) => $s['group'] === 'suggested'), 'tld'),
        );
        $this->assertSame(
            ['online', 'net'],
            array_column(array_filter($suggestions, fn ($s) => $s['group'] === 'other'), 'tld'),
        );
        $this->assertTrue($suggestions[0]['is_suggested']);
    }

    public function test_check_defaults_to_com_when_only_name_is_typed(): void
    {
        Http::fake([
            '*/auth/login' => Http::response(['token' => 'test-token']),
            '*/domains/check' => Http::response(['code' => 0, 'data' => ['results' => []]]),
        ]);

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/domain/check', [
            'name' => 'namatoko',
        ]);

        $res->assertOk()
            ->assertJsonPath('domain', 'namatoko.com')
            ->assertJsonCount(6, 'suggestions');
    }

    public function test_check_accepts_query_or_domain_and_falls_back_to_com_for_unknown_tld(): void
    {
        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/domain/check', [
            'query' => 'https://www.tokoku.invalid/path',
        ]);

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('domain', 'tokoku.com')
            ->assertJsonCount(6, 'suggestions');
    }

    public function test_check_simulates_when_registrar_is_unreachable(): void
    {
        Http::fake(fn () => throw new ConnectionException('Operation timed out'));

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/domain/check', [
            'name' => 'tokoku.com',
        ]);

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('domain', 'tokoku.com')
            ->assertJsonPath('simulated', true)
            ->assertJsonPath('currency', 'IDR');

        $this->assertEquals(195000, $res->json('price'));

        $this->assertIsBool($res->json('available'));
        $this->assertCount(6, $res->json('suggestions'));
        $this->assertNotNull($res->json('suggestions')[0]['price']);
    }

    public function test_register_simulates_and_activates_store_custom_domain(): void
    {
        Http::fake(fn () => throw new ConnectionException('Operation timed out'));

        $name = 'tokoku-'.$this->suffix;
        $domain = $name.'.com';

        $res = $this->withHeaders($this->headers)->postJson('/api/v1/merchant/domain/register', [
            'name' => $name,
            'tld' => 'com',
            'years' => 2,
        ]);

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('domain', $domain)
            ->assertJsonPath('simulated', true)
            ->assertJsonPath('store.custom_domain', $domain);

        $this->assertSame($domain, $this->store->fresh()->custom_domain);
        $this->assertSame('active', $this->store->fresh()->custom_domain_status);
        $this->assertTrue($this->store->fresh()->settings['domain_simulated']);
    }

    public function test_connect_saves_custom_domain_that_does_not_point_to_server(): void
    {
        $domain = 'belum-terpasang-'.$this->suffix.'.com';

        $res = $this->withHeaders($this->headers)->putJson('/api/v1/merchant/domain/connect', [
            'domain' => "https://{$domain}/path",
        ]);

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('domain', $domain)
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('dns', false)
            ->assertJsonPath('dns_records.0.type', 'A')
            ->assertJsonPath('dns_records.0.value', '103.121.122.135')
            ->assertJsonPath('dns_records.1.type', 'CNAME')
            ->assertJsonPath('dns_records.1.value', 'cname.alurelab.com');

        $this->assertSame($domain, $this->store->fresh()->custom_domain);
        $this->assertSame('pending', $this->store->fresh()->custom_domain_status);
    }

    public function test_connect_rejects_store_own_subdomain(): void
    {
        $res = $this->withHeaders($this->headers)->putJson('/api/v1/merchant/domain/connect', [
            'domain' => $this->store->slug.'.'.config('app.root_domain', 'alurelab.com'),
        ]);

        $res->assertStatus(422);
    }

    public function test_connect_rejects_domain_without_extension(): void
    {
        $this->withHeaders($this->headers)
            ->putJson('/api/v1/merchant/domain/connect', ['domain' => 'tokoku'])
            ->assertStatus(422);
    }
}
