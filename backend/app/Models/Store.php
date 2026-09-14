<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Store extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $casts = [
        'settings' => 'array',
        'plan_expires_at' => 'datetime',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'store_users')->withPivot('role');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'tenant_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'tenant_id');
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(MerchantWallet::class, 'store_id');
    }
}
