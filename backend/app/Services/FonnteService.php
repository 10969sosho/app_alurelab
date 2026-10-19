<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class FonnteService
{
    public function sendOtp(string $phone, string $otp): bool
    {
        $token = (string) config('services.fonnte.token', '');

        if ($token === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->withHeaders(['Authorization' => $token])
                ->timeout(10)
                ->post((string) config('services.fonnte.url', 'https://api.fonnte.com/send'), [
                    'target' => $phone,
                    'message' => "Kode OTP AlureLab Anda adalah: {$otp}. Jangan berikan kode ini kepada siapapun.",
                ]);
        } catch (ConnectionException) {
            return false;
        }

        return $response->successful() && $response->json('status') === true;
    }
}
