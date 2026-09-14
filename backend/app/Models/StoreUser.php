<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class StoreUser extends Pivot
{
    use HasUuids;

    protected $table = 'store_users';
    public $incrementing = false;
    protected $guarded = [];
}
