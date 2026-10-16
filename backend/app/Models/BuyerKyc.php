<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyerKyc extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['ktp_number', 'ktp_image', 'selfie_image'];

    protected $casts = [
        'ktp_number' => 'encrypted',
        'verified_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
