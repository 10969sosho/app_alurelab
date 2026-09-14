<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => PaymentStatus::class,
        'amount' => 'decimal:2',
        'gateway_fee' => 'decimal:2',
        'paid_at' => 'datetime',
        'raw_webhook_payload' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'tenant_id');
    }
}
