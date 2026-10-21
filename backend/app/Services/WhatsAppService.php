<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $url;

    protected string $token;

    public function __construct()
    {
        $this->url = (string) config('services.whatsapp.url', 'http://127.0.0.1:5001/send');
        $this->token = (string) config('services.whatsapp.token', 'alurelab_wa_secret_2026');
    }

    /**
     * Send general text message via WhatsApp Gateway
     */
    public function sendMessage(string $phone, string $message): bool
    {
        if (empty($this->token) || empty($this->url)) {
            Log::warning('WhatsApp Gateway: URL atau API Token belum dikonfigurasi.');

            return false;
        }

        try {
            $response = Http::asJson()
                ->withHeaders([
                    'Authorization' => 'Bearer '.$this->token,
                    'x-api-key' => $this->token,
                ])
                ->timeout(10)
                ->post($this->url, [
                    'target' => $phone,
                    'message' => $message,
                ]);

            if ($response->successful() && $response->json('status') === true) {
                return true;
            }

            Log::error('WhatsApp Gateway Gagal:', [
                'target' => $phone,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return false;
        } catch (ConnectionException $e) {
            Log::error('WhatsApp Gateway Connection Exception: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send OTP verification message
     */
    public function sendOtp(string $phone, string $otp): bool
    {
        $message = "Kode OTP AlureLab Anda adalah: *{$otp}*.\nJangan berikan kode ini kepada siapapun demi keamanan akun Anda.";

        return $this->sendMessage($phone, $message);
    }
}
