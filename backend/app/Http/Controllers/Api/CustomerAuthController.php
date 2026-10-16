<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
    public function requestOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => 'required|string|min:8|max:30',
        ]);

        if (! app()->environment(['local', 'testing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pengiriman OTP belum dikonfigurasi.',
            ], 503);
        }

        $normalizedPhone = $this->normalizePhone($validated['phone_number']);
        $otp = random_int(100000, 999999);
        // Store OTP for 5 minutes
        Cache::put('otp_'.$normalizedPhone, $otp, 300);

        $response = [
            'success' => true,
            'message' => 'OTP sent',
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

    public function getOrder(Request $request, string $id): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['error' => 'CustomerNotFound'], 404);
        }

        $order = Order::where('tenant_id', $store->id)
            ->where('customer_id', $customer->id)
            ->with([
                'items.product',
                'payment',
                'shipment',
                'refundRequests:id,order_id,type,reason,amount,status,reviewed_at,created_at',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }
}
