<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user (standalone, tanpa store).
     * Digunakan oleh frontend onboarding yang sudah punya store.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:30|unique:users,phone_number',
            'password'     => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'phone_number'  => $validated['phone_number'],
            'password_hash' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('dashboard', ['role:owner'])->plainTextToken;

        return response()->json([
            'message' => 'Akun berhasil dibuat.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ], 201);
    }

    /**
     * Login dan dapatkan Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Ambil store pertama yang dimiliki user (untuk MVP single-store)
        $storeUser = StoreUser::with('store')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->first();

        // Hapus token lama (opsional: revoke semua, enforce single session)
        $user->tokens()->delete();

        $abilities = $storeUser ? ["role:{$storeUser->role}"] : ['role:owner'];
        $token = $user->createToken('dashboard', $abilities)->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user'    => $this->formatUser($user),
            'store'   => $storeUser ? $this->formatStore($storeUser->store) : null,
            'token'   => $token,
        ]);
    }

    /**
     * Logout — revoke token aktif.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    /**
     * GET /me — return data user + store yang sedang login.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $storeUser = StoreUser::with('store')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->first();

        return response()->json([
            'user'  => $this->formatUser($user),
            'store' => $storeUser ? $this->formatStore($storeUser->store) : null,
            'role'  => $storeUser?->role ?? 'owner',
        ]);
    }

    // ─── Private Formatters ───────────────────────────────────────────────────

    private function formatUser(User $user): array
    {
        return [
            'id'           => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'phone_number' => $user->phone_number,
            'is_superadmin'=> $user->is_superadmin,
            'created_at'   => $user->created_at,
        ];
    }

    private function formatStore(Store $store): array
    {
        return [
            'id'                   => $store->id,
            'name'                 => $store->name,
            'slug'                 => $store->slug,
            'logo_url'             => $store->logo_url,
            'plan_tier'            => $store->plan_tier,
            'plan_expires_at'      => $store->plan_expires_at,
            'custom_domain'        => $store->custom_domain,
            'custom_domain_status' => $store->custom_domain_status,
            'xendit_account_status'=> $store->xendit_account_status,
        ];
    }
}
