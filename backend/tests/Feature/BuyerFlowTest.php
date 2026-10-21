<?php

namespace Tests\Feature;

use App\Models\BuyerKyc;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class BuyerFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_registers_with_otp_without_ktp(): void
    {
        config([
            'services.whatsapp.url' => 'https://api.fonnte.com/send',
            'services.whatsapp.token' => 'test-token',
        ]);
        Http::fake([
            'https://api.fonnte.com/send' => Http::response(['status' => true]),
        ]);

        $phone = '081234'.random_int(100000, 999999);
        $headers = ['X-Store-Slug' => $this->createStore()->slug];

        $otpResponse = $this->withHeaders($headers)->postJson('/api/v1/buyer/request-otp', [
            'phone_number' => $phone,
        ]);

        $otpResponse->assertOk()->assertJsonStructure(['dev_otp']);
        Http::assertSent(fn ($request) => $request->url() === 'https://api.fonnte.com/send'
            && $request->hasHeader('Authorization', 'Bearer test-token')
            && $request['target'] === '6281234'.substr($phone, -6)
            && $request['message'] === 'Kode OTP AlureLab Anda adalah: *'.$otpResponse->json('dev_otp')."*.\nJangan berikan kode ini kepada siapapun demi keamanan akun Anda.");

        $loginResponse = $this->withHeaders($headers)->postJson('/api/v1/buyer/verify-otp', [
            'phone_number' => $phone,
            'otp' => (string) $otpResponse->json('dev_otp'),
        ]);

        $loginResponse->assertOk()->assertJsonPath('customer.phone_verified', true);
        $this->assertDatabaseHas('customers', [
            'phone_number' => '6281234'.substr($phone, -6),
            'phone_verified' => true,
        ]);
        $this->assertDatabaseCount('buyer_kycs', 0);
    }

    public function test_otp_response_omits_dev_code_outside_local_and_testing(): void
    {
        config([
            'services.whatsapp.url' => 'https://api.fonnte.com/send',
            'services.whatsapp.token' => 'test-token',
            'app.env' => 'production',
            'app.debug' => false,
        ]);
        Http::fake([
            'https://api.fonnte.com/send' => Http::response(['status' => true]),
        ]);
        $this->app->detectEnvironment(fn (): string => 'production');
        $store = $this->createStore();

        $response = $this->withHeader('X-Store-Slug', $store->slug)->postJson('/api/v1/buyer/request-otp', [
            'phone_number' => '081234567899',
        ]);

        $response->assertOk()->assertJsonMissingPath('dev_otp');
    }

    public function test_guest_checkout_completes_without_ktp(): void
    {
        config(['services.qa_simulation.enabled' => true, 'services.qa_simulation.store_slug' => 'buyer-test']);
        $store = $this->createStore('buyer-test-'.Str::lower(Str::random(6)));
        $product = Product::create([
            'tenant_id' => $store->id,
            'title' => 'Produk Uji',
            'slug' => 'produk-uji',
            'price' => 50000,
            'weight_grams' => 300,
            'is_active' => true,
        ]);
        $variant = ProductVariant::create([
            'tenant_id' => $store->id,
            'product_id' => $product->id,
            'title' => 'Satu ukuran',
            'price' => 50000,
            'stock' => 5,
        ]);

        $response = $this->withHeader('X-Store-Slug', $store->slug)->postJson('/api/v1/checkout', [
            'customer_name' => 'Buyer Guest',
            'customer_phone' => '081234567890',
            'destination_area_id' => 'IDNP6',
            'address_detail' => 'Jalan Uji 1',
            'courier_code' => 'sicepat',
            'courier_service' => 'reg',
            'shipping_cost' => 10000,
            'payment_method' => 'ONLINE',
            'items' => [[
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'quantity' => 1,
            ]],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('customers', [
            'phone_number' => '6281234567890',
            'phone_verified' => false,
        ]);
        $this->assertDatabaseCount('buyer_kycs', 0);
    }

    public function test_buyer_can_submit_kyc_documents_to_private_storage(): void
    {
        Storage::fake('local');
        $store = $this->createStore();
        $customer = $this->createBuyer();

        $response = $this->actingAs($customer, 'sanctum')
            ->withHeader('X-Store-Slug', $store->slug)
            ->post('/api/v1/buyer/kyc/submit', [
                'full_name' => 'Buyer Identitas',
                'ktp_number' => '3201012345678901',
                'ktp_image' => UploadedFile::fake()->image('ktp.jpg'),
                'selfie_image' => UploadedFile::fake()->image('selfie.jpg'),
            ]);

        $response->assertCreated()->assertJsonPath('status', 'pending');
        $kyc = BuyerKyc::firstOrFail();
        $this->assertSame('3201012345678901', $kyc->ktp_number);
        Storage::disk('local')->assertExists($kyc->ktp_image);
        Storage::disk('local')->assertExists($kyc->selfie_image);
        $this->assertStringNotContainsString('3201012345678901', $response->getContent());
        $this->assertDatabaseMissing('buyer_kycs', ['ktp_number' => '3201012345678901']);
    }

    public function test_refund_requires_approved_kyc_and_saves_bank_account(): void
    {
        $store = $this->createStore();
        $customer = $this->createBuyer();
        $order = $this->createCompletedOrder($store, $customer);
        $headers = ['X-Store-Slug' => $store->slug];

        $blocked = $this->actingAs($customer, 'sanctum')
            ->withHeaders($headers)
            ->postJson("/api/v1/buyer/orders/{$order->id}/refund", []);

        $blocked->assertForbidden()->assertJsonPath('error', 'identity_verification_required');
        $this->assertDatabaseCount('buyer_refund_requests', 0);

        $customer->kyc()->create([
            'full_name' => 'Buyer Identitas',
            'ktp_number' => '3201012345678901',
            'ktp_image' => 'private/ktp.jpg',
            'selfie_image' => 'private/selfie.jpg',
            'status' => 'pending',
        ]);
        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/v1/admin/buyers/{$customer->id}/kyc", ['status' => 'approved'])
            ->assertForbidden();

        $admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin-'.Str::lower(Str::random(8)).'@example.com',
            'password_hash' => bcrypt('secret'),
            'is_superadmin' => true,
        ]);
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/buyers/{$customer->id}/kyc", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('status', 'approved');

        $allowed = $this->actingAs($customer, 'sanctum')
            ->withHeaders($headers)
            ->postJson("/api/v1/buyer/orders/{$order->id}/refund", [
                'type' => 'refund',
                'reason' => 'Barang rusak saat diterima.',
                'bank_name' => 'Bank Contoh',
                'account_number' => '1234567890',
                'account_holder_name' => 'Buyer Identitas',
            ]);

        $allowed->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->assertDatabaseHas('buyer_refund_requests', [
            'order_id' => $order->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);
        $this->assertSame('1234567890', $customer->bankAccount()->firstOrFail()->account_number);
    }

    private function createStore(?string $slug = null): Store
    {
        return Store::create([
            'name' => 'Buyer Test Store',
            'slug' => $slug ?? 'buyer-'.Str::lower(Str::random(8)),
            'phone_number' => '081234567890',
            'address_area_id' => 'IDNP6',
        ]);
    }

    private function createBuyer(): Customer
    {
        return Customer::create([
            'phone_number' => '628'.random_int(100000000, 999999999),
            'full_name' => 'Buyer Test',
            'default_address' => [],
        ]);
    }

    private function createCompletedOrder(Store $store, Customer $customer): Order
    {
        return Order::create([
            'tenant_id' => $store->id,
            'order_number' => 'ORD-'.Str::upper(Str::random(10)),
            'customer_id' => $customer->id,
            'status' => 'completed',
            'items_subtotal' => 100000,
            'shipping_cost' => 10000,
            'total_amount' => 110000,
            'platform_fee_amount' => 1500,
            'merchant_net_amount' => 108500,
            'shipping_recipient_name' => 'Buyer Test',
            'shipping_recipient_phone' => $customer->phone_number,
            'shipping_destination_area_id' => 'IDNP6',
            'shipping_address_detail' => 'Jalan Uji 1',
        ]);
    }
}
