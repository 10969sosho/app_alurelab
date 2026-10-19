<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'Siti Rahma',
            'email' => 'siti.'.uniqid().'@example.com',
            'phone_number' => '08'.rand(100000000, 999999999),
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'phone_number'],
            ]);

        $this->assertNull(User::where('email', $payload['email'])->first()->email_verified_at);
    }

    public function test_user_can_login_and_access_me(): void
    {
        $email = 'budi.'.uniqid().'@example.com';
        $phone = '08'.rand(100000000, 999999999);

        // Register first
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi Test',
            'email' => $email,
            'phone_number' => $phone,
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        // Unverified users cannot login.
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'secret1234',
        ]);

        $loginResponse->assertStatus(422);

        User::where('email', $email)->first()->markEmailAsVerified();

        // Login after email verification.
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'secret1234',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);

        $token = $loginResponse->json('token');

        // Access /me
        $meResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $meResponse->assertStatus(200)
            ->assertJsonPath('user.email', $email);

        // Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $logoutResponse->assertStatus(200);
    }

    public function test_google_callback_creates_new_verified_user_with_default_store(): void
    {
        $email = 'google.'.uniqid().'@gmail.com';

        $response = $this->postJson('/api/v1/auth/google-callback', [
            'email' => $email,
            'name' => 'Google User',
            'google_id' => 'gid-'.uniqid(),
            'avatar' => 'https://example.com/avatar.jpg',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email'], 'store' => ['id', 'name', 'slug']]);

        $this->assertNotNull($response->json('store'));
        $this->assertSame('Toko Google', $response->json('store.name'));

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);

        $this->assertDatabaseHas('store_users', [
            'user_id' => $user->id,
            'store_id' => $response->json('store.id'),
            'role' => 'owner',
        ]);

        $me = $this->withHeader('Authorization', 'Bearer '.$response->json('token'))
            ->getJson('/api/v1/auth/me');
        $me->assertStatus(200)
            ->assertJsonPath('user.email', $email)
            ->assertJsonPath('store.id', $response->json('store.id'));
    }

    public function test_google_callback_links_existing_user_and_returns_store(): void
    {
        $email = 'existing.'.uniqid().'@example.com';

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Existing User',
            'email' => $email,
            'phone_number' => '08'.rand(100000000, 999999999),
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $response = $this->postJson('/api/v1/auth/google-callback', [
            'email' => $email,
            'name' => 'Existing User',
            'google_id' => 'gid-'.uniqid(),
        ]);

        $response->assertStatus(200)->assertJsonPath('user.email', $email);

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user->google_id);
        $this->assertNotNull($user->email_verified_at);
    }
}
