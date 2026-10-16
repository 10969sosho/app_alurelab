<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens, HasUuids;

    protected $guarded = ['id'];

    protected $casts = [
        'default_address' => 'array',
        'risk_score' => 'decimal:2',
        'is_blacklisted' => 'boolean',
        'phone_verified' => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function kyc(): HasOne
    {
        return $this->hasOne(BuyerKyc::class);
    }

    public function bankAccount(): HasOne
    {
        return $this->hasOne(BuyerBankAccount::class);
    }

    public function refundRequests(): HasMany
    {
        return $this->hasMany(BuyerRefundRequest::class);
    }
}
