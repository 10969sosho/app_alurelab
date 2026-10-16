<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyerRefundRequest extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['account_number'];

    protected $casts = [
        'account_number' => 'encrypted',
        'amount' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'tenant_id');
    }
}
