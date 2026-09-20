<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasUuids;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'body',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function isFromSeller(): bool
    {
        return $this->sender_type === 'seller';
    }

    public function isFromBuyer(): bool
    {
        return $this->sender_type === 'buyer';
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
