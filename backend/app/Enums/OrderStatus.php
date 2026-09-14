<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING_PAYMENT = 'pending_payment';
    case PAID_ESCROW = 'paid_escrow';
    case COD_VERIFIED = 'cod_verified';
    case PROCESSING = 'processing';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case RTS_RETURNED = 'rts_returned';

    public function label(): string
    {
        return match ($this) {
            self::PENDING_PAYMENT => 'Menunggu Pembayaran',
            self::PAID_ESCROW => 'Terbayar (Escrow Ditahan)',
            self::COD_VERIFIED => 'COD Terverifikasi',
            self::PROCESSING => 'Diproses Penjual',
            self::SHIPPED => 'Sedang Dikirim',
            self::DELIVERED => 'Paket Terkirim',
            self::COMPLETED => 'Selesai (Dana Cair)',
            self::CANCELLED => 'Dibatalkan',
            self::RTS_RETURNED => 'Paket Gagal / Retur (RTS)',
        };
    }
}
