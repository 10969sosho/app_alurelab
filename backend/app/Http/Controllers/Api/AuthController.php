<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:30|unique:users,phone_number',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.unique' => 'Email sudah terdaftar. Gunakan email lain.',
            'email.email' => 'Format email tidak valid.',
            'email.required' => 'Email wajib diisi.',
            'phone_number.unique' => 'Nomor WhatsApp sudah terdaftar. Gunakan nomor lain.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'password_hash' => Hash::make($validated['password']),
        ]);

        event(new Registered($user));

        return response()->json([
            'message' => 'Akun berhasil dibuat. Silakan verifikasi email Anda.',
            'user' => $this->formatUser($user),
        ], 201);
    }

    /**
     * Login dan dapatkan Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Silakan verifikasi email Anda terlebih dahulu.'],
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
            'user' => $this->formatUser($user),
            'store' => $storeUser ? $this->formatStore($storeUser->store) : null,
            'token' => $token,
        ]);
    }

    /**
     * Google OAuth callback — dipanggil oleh frontend NextAuth.
     * Find-or-create user by email, lalu issue Sanctum token (format sama seperti login).
     * User tanpa toko langsung mendapat toko otomatis (frictionless onboarding),
     * sehingga redirect selesai lurus ke /dashboard tanpa dicegat /create-store.
     */
    public function googleCallback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'google_id' => 'nullable|string|max:255',
            'avatar' => 'nullable|string|max:2048',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password_hash' => Hash::make(Str::random(32)),
                'google_id' => $validated['google_id'] ?? null,
            ]);

            // email_verified_at bukan fillable — set eksplisit (Google email sudah terverifikasi)
            $user->forceFill(['email_verified_at' => now()])->save();

            event(new Registered($user));
        } else {
            $needsUpdate = false;

            if (! $user->hasVerifiedEmail()) {
                $user->email_verified_at = now();
                $needsUpdate = true;
            }

            if (! empty($validated['google_id']) && $user->google_id !== $validated['google_id']) {
                $user->google_id = $validated['google_id'];
                $needsUpdate = true;
            }

            if ($needsUpdate) {
                $user->save();
            }
        }

        // Ambil store pertama yang dimiliki user (MVP single-store)
        $storeUser = StoreUser::with('store')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->first();

        // User baru / belum punya toko → provision toko default secara atomik
        if (! $storeUser) {
            $storeUser = $this->provisionDefaultStore($user);
        }

        $user->tokens()->delete();

        $abilities = ["role:{$storeUser->role}"];
        $token = $user->createToken('dashboard', $abilities)->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $this->formatUser($user),
            'store' => $this->formatStore($storeUser->store),
            'token' => $token,
        ]);
    }

    /**
     * Buat toko default + membership owner untuk user yang belum punya toko.
     */
    private function provisionDefaultStore(User $user): StoreUser
    {
        $firstName = explode(' ', trim($user->name))[0] ?: 'Toko';

        return DB::transaction(function () use ($user, $firstName) {
            $store = Store::create([
                'name' => 'Toko '.$firstName,
                'slug' => Str::slug('toko-'.$firstName.'-'.Str::lower(Str::random(5))),
                'phone_number' => $user->phone_number ?: '-',
                'plan_tier' => 'free',
                'custom_domain_status' => 'pending',
                'settings' => [
                    'template' => 'default',
                    'theme' => 'default',
                    'status' => 'active',
                    'theme_color' => '#0F172A',
                    'tagline' => 'Toko Resmi '.$firstName,
                    'allow_cod' => true,
                ],
            ]);

            return StoreUser::create([
                'store_id' => $store->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);
        });
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
            'user' => $this->formatUser($user),
            'store' => $storeUser ? $this->formatStore($storeUser->store) : null,
            'role' => $storeUser?->role ?? 'owner',
        ]);
    }

    // ─── Private Formatters ───────────────────────────────────────────────────

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'is_superadmin' => $user->is_superadmin,
            'created_at' => $user->created_at,
        ];
    }

    private function formatStore(Store $store): array
    {
        return [
            'id' => $store->id,
            'name' => $store->name,
            'slug' => $store->slug,
            'logo_url' => $store->logo_url,
            'plan_tier' => $store->plan_tier,
            'plan_expires_at' => $store->plan_expires_at,
            'custom_domain' => $store->custom_domain,
            'custom_domain_status' => $store->custom_domain_status,
            'doku_sub_account_id' => $store->doku_sub_account_id,
            'doku_account_status' => $store->doku_account_status,
        ];
    }
}
