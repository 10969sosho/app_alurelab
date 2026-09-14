<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AuthTest extends TestCase
{
    public function test_user_can_register(): void
    {
        $payload = [
            'name'                  => 'Siti Rahma',
            'email'                 => 'siti.' . uniqid() . '@example.com',
            'phone_number'          => '08' . rand(100000000, 999999999),
            'password'              => 'secret1234',
            'password_confirmation' => 'secret1234',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'user' => ['id', 'name', 'email', 'phone_number'],
                     'token',
                 ]);
    }

    public function test_user_can_login_and_access_me(): void
    {
        $email = 'budi.' . uniqid() . '@example.com';
        $phone = '08' . rand(100000000, 999999999);

        // Register first
        $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Budi Test',
            'email'                 => $email,
            'phone_number'          => $phone,
            'password'              => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        // Login
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => $email,
            'password' => 'secret1234',
        ]);

        $loginResponse->assertStatus(200)
                      ->assertJsonStructure(['token', 'user']);

        $token = $loginResponse->json('token');

        // Access /me
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                           ->getJson('/api/v1/auth/me');

        $meResponse->assertStatus(200)
                   ->assertJsonPath('user.email', $email);

        // Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                               ->postJson('/api/v1/auth/logout');

        $logoutResponse->assertStatus(200);
    }
}
