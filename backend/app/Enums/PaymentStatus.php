<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING  = 'PENDING';
    case PAID     = 'PAID';
    case EXPIRED  = 'EXPIRED';
    case REFUNDED = 'REFUNDED';
    case FAILED   = 'FAILED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING  => 'Menunggu Pembayaran',
            self::PAID     => 'Lunas',
            self::EXPIRED  => 'Kadaluarsa',
            self::REFUNDED => 'Dikembalikan (Refund)',
            self::FAILED   => 'Gagal',
        };
    }
}
