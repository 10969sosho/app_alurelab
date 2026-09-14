<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING_PAYMENT = 'pending_payment';
    case PAID_ESCROW     = 'paid_escrow';
    case COD_VERIFIED    = 'cod_verified';
    case PROCESSING      = 'processing';
    case SHIPPED         = 'shipped';
    case DELIVERED       = 'delivered';
    case COMPLETED       = 'completed';
    case CANCELLED       = 'cancelled';
    case RTS_RETURNED    = 'rts_returned';

    public function label(): string
    {
        return match ($this) {
            self::PENDING_PAYMENT => 'Menunggu Pembayaran',
            self::PAID_ESCROW     => 'Dibayar (Escrow)',
            self::COD_VERIFIED    => 'COD Terverifikasi',
            self::PROCESSING      => 'Sedang Diproses',
            self::SHIPPED         => 'Dikirim',
            self::DELIVERED       => 'Terkirim',
            self::COMPLETED       => 'Selesai',
            self::CANCELLED       => 'Dibatalkan',
            self::RTS_RETURNED    => 'Retur (RTS)',
        };
    }
}
