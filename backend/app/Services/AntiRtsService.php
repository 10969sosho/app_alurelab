<?php

namespace App\Services;

use App\Models\Customer;

class AntiRtsService
{
    /**
     * Menghitung skor risiko pembeli lintas-toko (Cross-Tenant Fraud Scoring).
     * Rentang skor 0.00 - 100.00 (Skor >= 40.00 dianggap berisiko tinggi).
     */
    public function evaluateCustomerRisk(Customer $customer): array
    {
        if ($customer->is_blacklisted) {
            return [
                'allow_cod' => false,
                'require_dp' => true,
                'risk_score' => 100.00,
                'reason' => 'Nomor WhatsApp terdaftar dalam daftar hitam (Blacklist).',
            ];
        }

        $totalOrders = $customer->total_orders;
        $rejectedOrders = $customer->rts_rejected_orders;

        if ($totalOrders > 0 && ($rejectedOrders / $totalOrders) >= 0.30) {
            return [
                'allow_cod' => false,
                'require_dp' => true,
                'dp_amount' => 20000.00, // Wajib bayar DP ongkir Rp 20.000 via QRIS
                'risk_score' => round(($rejectedOrders / $totalOrders) * 100, 2),
                'reason' => 'Rasio penolakan paket COD sebelumnya melebihi batas aman (>= 30%). Wajib DP Ongkir.',
            ];
        }

        return [
            'allow_cod' => true,
            'require_dp' => false,
            'risk_score' => $customer->risk_score,
            'reason' => 'Profil pembeli memenuhi syarat verifikasi COD.',
        ];
    }

    /**
     * Memperbarui rekam jejak pesanan selesai vs retur (RTS).
     */
    public function recordOrderOutcome(Customer $customer, bool $isDelivered): void
    {
        $customer->increment('total_orders');

        if ($isDelivered) {
            $customer->increment('completed_orders');
        } else {
            $customer->increment('rts_rejected_orders');
        }

        // Recalculate score
        $newScore = ($customer->rts_rejected_orders / max(1, $customer->total_orders)) * 100;
        $customer->update([
            'risk_score' => round($newScore, 2),
            'is_blacklisted' => $newScore >= 60.0 && $customer->rts_rejected_orders >= 3,
        ]);
    }
}
