<?php

namespace App\Services;

/**
 * FonnteService compatibility wrapper
 * Now powered by self-hosted AlureLab WhatsApp Gateway (Baileys)
 */
class FonnteService
{
    protected WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function sendOtp(string $phone, string $otp): bool
    {
        return $this->whatsapp->sendOtp($phone, $otp);
    }

    public function sendMessage(string $phone, string $message): bool
    {
        return $this->whatsapp->sendMessage($phone, $message);
    }
}
