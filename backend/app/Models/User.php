<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
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
        'is_superadmin'     => 'boolean',
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
