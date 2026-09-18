<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone_number',
        'password_hash',
        'is_superadmin',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'is_superadmin' => 'boolean',
        'email_verified_at' => 'datetime',
    ];

    /**
     * Override nama kolom password — ALURELAB pakai "password_hash" bukan "password"
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class, 'store_users')->withPivot('role');
    }

    public function storeUsers(): HasMany
    {
        return $this->hasMany(StoreUser::class);
    }
}
