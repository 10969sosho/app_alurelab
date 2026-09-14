<?php

namespace App\Enums;

enum WalletTxType: string
{
    case ORDER_ESCROW_CREDIT = 'ORDER_ESCROW_CREDIT';
    case ESCROW_RELEASED = 'ESCROW_RELEASED';
    case WITHDRAWAL = 'WITHDRAWAL';
    case REFUND_DEBIT = 'REFUND_DEBIT';
    case PLATFORM_FEE_DEBIT = 'PLATFORM_FEE_DEBIT';
}
