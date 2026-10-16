<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BuyerKyc;
use App\Models\BuyerRefundRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BuyerFlowController extends Controller
{
    public function kycStatus(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['message' => 'Profil pembeli tidak ditemukan.'], 404);
        }

        $kyc = $customer->kyc()->first();

        return response()->json([
            'success' => true,
            'status' => $kyc?->status ?? 'unverified',
            'verified_at' => $kyc?->verified_at,
            'rejection_reason' => $kyc?->rejection_reason,
        ]);
    }

    public function submitKyc(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['message' => 'Profil pembeli tidak ditemukan.'], 404);
        }

        $existingKyc = $customer->kyc()->first();
        if (in_array($existingKyc?->status, ['pending', 'approved'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan identitas sedang diproses atau sudah disetujui.',
            ], 409);
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'ktp_number' => ['required', 'string', 'digits:16'],
            'ktp_image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'selfie_image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $directory = 'buyer-kyc/'.$customer->id;
        $ktpPath = $request->file('ktp_image')->store($directory, 'local');
        $selfiePath = $request->file('selfie_image')->store($directory, 'local');

        if (! $ktpPath || ! $selfiePath) {
            Storage::disk('local')->delete(array_filter([$ktpPath, $selfiePath]));

            return response()->json([
                'success' => false,
                'message' => 'Dokumen identitas gagal disimpan. Silakan coba lagi.',
            ], 500);
        }

        $previousPaths = [$existingKyc?->ktp_image, $existingKyc?->selfie_image];
        try {
            $customer->kyc()->updateOrCreate([], [
                'full_name' => $validated['full_name'],
                'ktp_number' => $validated['ktp_number'],
                'ktp_image' => $ktpPath,
                'selfie_image' => $selfiePath,
                'status' => 'pending',
                'verified_at' => null,
                'rejection_reason' => null,
            ]);
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete([$ktpPath, $selfiePath]);
            throw $exception;
        }

        Storage::disk('local')->delete(array_filter($previousPaths));

        return response()->json([
            'success' => true,
            'status' => 'pending',
            'message' => 'Dokumen identitas berhasil dikirim untuk ditinjau.',
        ], 201);
    }

    public function bankAccount(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['message' => 'Profil pembeli tidak ditemukan.'], 404);
        }

        $account = $customer->bankAccount()->first();

        return response()->json([
            'success' => true,
            'data' => $account ? [
                'bank_name' => $account->bank_name,
                'account_number' => $account->account_number,
                'account_holder_name' => $account->account_holder_name,
            ] : null,
        ]);
    }

    public function requestRefund(Request $request, string $id): JsonResponse
    {
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            return response()->json(['message' => 'Profil pembeli tidak ditemukan.'], 404);
        }

        if (! $customer->kyc()->where('status', 'approved')->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'identity_verification_required',
                'message' => 'Verifikasi identitas (KTP) harus disetujui sebelum mengajukan retur atau refund.',
            ], 403);
        }

        /** @var Store $store */
        $store = app('current_tenant');
        $order = Order::where('tenant_id', $store->id)
            ->where('customer_id', $customer->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'type' => ['required', 'in:return,refund'],
            'reason' => ['required', 'string', 'max:2000'],
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'digits_between:6,30'],
            'account_holder_name' => ['required', 'string', 'max:255'],
        ]);

        $refundRequest = DB::transaction(function () use ($customer, $order, $store, $validated): BuyerRefundRequest {
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if (! in_array($lockedOrder->status->value, ['delivered', 'completed'], true)) {
                throw ValidationException::withMessages([
                    'order' => 'Retur atau refund hanya dapat diajukan untuk pesanan yang sudah diterima.',
                ]);
            }

            if ($lockedOrder->refundRequests()->whereIn('status', ['pending', 'approved'])->exists()) {
                throw ValidationException::withMessages([
                    'order' => 'Pengajuan retur atau refund untuk pesanan ini masih diproses.',
                ]);
            }

            $customer->bankAccount()->updateOrCreate([], [
                'bank_name' => $validated['bank_name'],
                'account_number' => $validated['account_number'],
                'account_holder_name' => $validated['account_holder_name'],
            ]);

            return $lockedOrder->refundRequests()->create([
                'customer_id' => $customer->id,
                'tenant_id' => $store->id,
                'type' => $validated['type'],
                'reason' => $validated['reason'],
                'amount' => $lockedOrder->total_amount,
                'status' => 'pending',
                'bank_name' => $validated['bank_name'],
                'account_number' => $validated['account_number'],
                'account_holder_name' => $validated['account_holder_name'],
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan retur/refund berhasil dikirim untuk ditinjau.',
            'data' => [
                'id' => $refundRequest->id,
                'status' => $refundRequest->status,
                'amount' => $refundRequest->amount,
            ],
        ], 201);
    }

    public function reviewKyc(Request $request, string $id): JsonResponse
    {
        if (! ($request->user() instanceof User) || ! $request->user()->is_superadmin) {
            return response()->json(['message' => 'Akses admin platform diperlukan.'], 403);
        }

        $kyc = BuyerKyc::where('customer_id', $id)->firstOrFail();
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
        ]);

        if ($kyc->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengajuan KYC yang sedang menunggu yang dapat ditinjau.',
            ], 409);
        }

        $kyc->update([
            'status' => $validated['status'],
            'verified_at' => $validated['status'] === 'approved' ? now() : null,
            'rejection_reason' => $validated['status'] === 'rejected' ? $validated['rejection_reason'] : null,
        ]);

        return response()->json([
            'success' => true,
            'status' => $kyc->status,
            'verified_at' => $kyc->verified_at,
            'rejection_reason' => $kyc->rejection_reason,
        ]);
    }

    public function adminKycStatus(Request $request, string $id): JsonResponse
    {
        if (! ($request->user() instanceof User) || ! $request->user()->is_superadmin) {
            return response()->json(['message' => 'Akses admin platform diperlukan.'], 403);
        }

        $kyc = BuyerKyc::where('customer_id', $id)->firstOrFail();

        return response()->json([
            'success' => true,
            'status' => $kyc->status,
            'full_name' => $kyc->full_name,
            'verified_at' => $kyc->verified_at,
            'rejection_reason' => $kyc->rejection_reason,
        ]);
    }

    public function kycDocument(Request $request, string $id, string $document): StreamedResponse|JsonResponse
    {
        if (! ($request->user() instanceof User) || ! $request->user()->is_superadmin) {
            return response()->json(['message' => 'Akses admin platform diperlukan.'], 403);
        }

        abort_unless(in_array($document, ['ktp', 'selfie'], true), 404);

        $kyc = BuyerKyc::where('customer_id', $id)->firstOrFail();
        $path = $document === 'ktp' ? $kyc->ktp_image : $kyc->selfie_image;

        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, basename($path), [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
