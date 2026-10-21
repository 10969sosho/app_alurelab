<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Store;
use App\Services\DokuService;
use App\Services\FonnteService;
use App\Services\OrderPaymentSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CustomerAuthController extends Controller
{
    /**
     * Normalisasi nomor telepon ke format E.164 Indonesia (628xxx).
     */
    protected function normalizePhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleaned, '0')) {
            return '62'.substr($cleaned, 1);
        }
        if (str_starts_with($cleaned, '8')) {
            return '62'.$cleaned;
        }

        return $cleaned;
    }

    /**
     * Login / Register One-Click Buyer via Nomor WhatsApp / HP.
     * DEPRECATED: Gunakan /buyer/request-otp + /buyer/verify-otp
     */
    public function login(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Endpoint ini sudah tidak aktif. Gunakan /buyer/request-otp lalu /buyer/verify-otp untuk login.',
        ], 410);
    }

    /**
     * Request OTP for buyer login.
     */
    public function requestOtp(Request $request, FonnteService $fonnte): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => 'required|string|min:8|max:30',
        ]);

        $normalizedPhone = $this->normalizePhone($validated['phone_number']);
        $otp = random_int(100000, 999999);
        $sent = $fonnte->sendOtp($normalizedPhone, (string) $otp);

        // Simpan OTP ke cache selama 5 menit
        Cache::put('otp_'.$normalizedPhone, $otp, 300);

        if (! $sent) {
            Log::warning("Fonnte WA Gateway disconnected for {$normalizedPhone}. Falling back to simulation OTP.");

            if (! app()->environment(['local', 'testing'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Layanan WhatsApp sedang dalam pemeliharaan. Coba lagi nanti.',
                ], 503);
            }

            return response()->json([
                'success' => true,
                'message' => 'Layanan WhatsApp sedang dalam pemeliharaan. Gunakan kode verifikasi di bawah.',
                'dev_otp' => $otp,
            ]);
        }

        $response = [
            'success' => true,
            'message' => 'Kode OTP berhasil dikirim melalui WhatsApp.',
        ];

        if (app()->environment(['local', 'testing'])) {
            $response['dev_otp'] = $otp;
        }

        return response()->json($response);
    }

    /**
     * Verify OTP and login / register buyer.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => 'required|string|min:8|max:30',
            'otp' => 'required|digits:6',
            'full_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
        ]);

        $normalizedPhone = $this->normalizePhone($validated['phone_number']);
        $cachedOtp = Cache::get('otp_'.$normalizedPhone);

        if (! $cachedOtp || $cachedOtp != $validated['otp']) {
            return response()->json(['success' => false, 'message' => 'OTP tidak valid atau kadaluarsa.'], 422);
        }

        // OTP valid, remove it
        Cache::forget('otp_'.$normalizedPhone);

        $customer = Customer::where('phone_number', $normalizedPhone)->first();

        if (! $customer) {
            $customer = Customer::create([
                'phone_number' => $normalizedPhone,
                'full_name' => $validated['full_name'] ?? 'Pelanggan '.substr($normalizedPhone, -4),
                'email' => $validated['email'] ?? null,
                'default_address' => [],
                'phone_verified' => true,
            ]);
        } else {
            $customer->update(['phone_verified' => true]);

            if (! empty($validated['full_name']) && (str_starts_with($customer->full_name, 'Pelanggan ') || empty($customer->full_name))) {
                $customer->update(['full_name' => $validated['full_name']]);
            }
            if (! empty($validated['email']) && empty($customer->email)) {
                $customer->update(['email' => $validated['email']]);
            }
        }

        $token = $customer->createToken('buyer-session', ['role:buyer'])->plainTextToken;

        // Ikat pelanggan ke toko tempat ia mendaftar agar langsung muncul
        // di daftar Pelanggan & Member dashboard merchant (meski belum belanja).
        /** @var Store|null $store */
        $store = app('current_tenant');
        if ($store && ! $customer->tenant_id) {
            $customer->forceFill(['tenant_id' => $store->id])->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil masuk ke akun pembeli.',
            'customer' => $customer,
            'token' => $token,
        ]);
    }

    /**
     * Ambil data profil pembeli aktif beserta alamat tersimpan.
     */
    public function getProfile(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['error' => 'CustomerNotFound', 'message' => 'Profil pembeli tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'customer' => $customer,
        ]);
    }

    /**
     * Update profil & alamat pengiriman utama pembeli.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'default_address' => 'nullable|array',
        ]);

        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['error' => 'CustomerNotFound'], 404);
        }

        $dataToUpdate = [];
        if (! empty($validated['full_name'])) {
            $dataToUpdate['full_name'] = $validated['full_name'];
        }
        if (! empty($validated['email'])) {
            $dataToUpdate['email'] = $validated['email'];
        }
        if (isset($validated['default_address'])) {
            $dataToUpdate['default_address'] = $validated['default_address'];
        }

        if (! empty($dataToUpdate)) {
            $customer->update($dataToUpdate);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'customer' => $customer,
        ]);
    }

    /**
     * Ambil daftar riwayat pesanan pembeli khusus pada toko aktif ini.
     */
    public function getOrders(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');

        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['data' => []]);
        }

        $orders = Order::where('tenant_id', $store->id)
            ->where('customer_id', $customer->id)
            ->with(['items.product', 'payment', 'shipment'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function getOrder(Request $request, string $id, OrderPaymentSyncService $paymentSync): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');
        $customer = $request->user();

        $orderQuery = Order::where('tenant_id', $store->id)
            ->with([
                'items.product',
                'payment',
                'shipment',
                'refundRequests:id,order_id,type,reason,amount,status,reviewed_at,created_at',
            ]);

        if (Str::isUuid($id)) {
            $orderQuery->where('id', $id);
        } else {
            $orderQuery->where('order_number', $id);
        }

        if ($customer instanceof Customer) {
            $orderQuery->where('customer_id', $customer->id);
        }

        $order = $orderQuery->first();

        if (! $order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        // On-demand sync payment jika order masih pending_payment
        if ($order->status === OrderStatus::PENDING_PAYMENT) {
            $order = $paymentSync->syncOrderPayment($order);
            $order->load(['payment', 'shipment']);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Inisiasi pembayaran dari halaman pembayaran in-app toko
     * (/{store_slug}/orders/{id}/pay).
     *
     * channel: BCA_VA | MANDIRI_VA | BRI_VA | BNI_VA (Direct VA) atau QRIS | DOKU_CHECKOUT (modal DOKU Checkout JS).
     */
    public function payOrder(Request $request, string $id, DokuService $dokuService): JsonResponse
    {
        $validated = $request->validate([
            'channel' => 'required|string|in:BCA_VA,MANDIRI_VA,BRI_VA,BNI_VA,QRIS,DOKU_CHECKOUT',
        ]);

        /** @var Store $store */
        $store = app('current_tenant');

        $orderQuery = Order::where('tenant_id', $store->id)->with(['payment', 'customer']);

        if (Str::isUuid($id)) {
            $orderQuery->where('id', $id);
        } else {
            $orderQuery->where('order_number', $id);
        }

        $order = $orderQuery->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->status === OrderStatus::PAID_ESCROW) {
            return response()->json([
                'success' => true,
                'status' => 'paid',
                'order_number' => $order->order_number,
            ]);
        }

        if ($order->status !== OrderStatus::PENDING_PAYMENT) {
            return response()->json(['success' => false, 'message' => 'Pesanan ini tidak menunggu pembayaran.'], 422);
        }

        $payment = $order->payment;
        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Record pembayaran pesanan ini tidak ditemukan.'], 422);
        }

        if ($payment->payment_method === 'COD') {
            return response()->json(['success' => false, 'message' => 'Pesanan COD dibayar di tempat, tidak perlu pembayaran online.'], 422);
        }

        $channel = $validated['channel'];

        // ── Mode A: Virtual Account Direct ───────────────────────────────
        if (str_ends_with($channel, '_VA')) {
            $bank = substr($channel, 0, -3);
            $existingVa = $payment->raw_webhook_payload['virtual_account'] ?? null;

            if ($existingVa && ($existingVa['bank'] ?? null) === $bank && ! empty($existingVa['va_number'])) {
                return response()->json([
                    'success' => true,
                    'mode' => 'va',
                    'va_number' => $existingVa['va_number'],
                    'bank' => $bank,
                    'expired_at' => $existingVa['expired_at'] ?? null,
                    'order_number' => $order->order_number,
                    'total_amount' => (float) $order->total_amount,
                ]);
            }

            $va = $dokuService->createDirectVa($order, $store, $bank);

            if (! $va['success']) {
                return response()->json(['success' => false, 'message' => $va['error']], 502);
            }

            $payment->update([
                'payment_channel' => $va['bank'],
                'raw_webhook_payload' => array_merge($payment->raw_webhook_payload ?? [], [
                    'virtual_account' => [
                        'va_number' => $va['va_number'],
                        'bank' => $va['bank'],
                        'expired_at' => $va['expired_at'],
                    ],
                ]),
            ]);

            return response()->json([
                'success' => true,
                'mode' => 'va',
                'va_number' => $va['va_number'],
                'bank' => $va['bank'],
                'expired_at' => $va['expired_at'],
                'order_number' => $order->order_number,
                'total_amount' => (float) $order->total_amount,
            ]);
        }

        // ── Mode B: QRIS / E-Wallet / All Channel (modal DOKU Checkout) ──
        $paymentUrl = $payment->payment_url;

        if (! $paymentUrl) {
            $invoice = $dokuService->createCheckoutInvoice($order, $store);

            if (! $invoice['success'] || ! $invoice['invoice_url']) {
                return response()->json(['success' => false, 'message' => $invoice['error'] ?? 'Gagal membuat tagihan pembayaran.'], 502);
            }

            $paymentUrl = $invoice['invoice_url'];
            $payment->update([
                'payment_url' => $paymentUrl,
                'doku_invoice_id' => $invoice['invoice_id'] ?? $order->order_number,
            ]);
        }

        return response()->json([
            'success' => true,
            'mode' => 'checkout',
            'payment_url' => $paymentUrl,
            'checkout_js_url' => $dokuService->checkoutJsUrl(),
            'order_number' => $order->order_number,
            'total_amount' => (float) $order->total_amount,
        ]);
    }
}
