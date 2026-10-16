<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyerBankAccount extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['account_number'];

    protected $casts = [
        'account_number' => 'encrypted',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
