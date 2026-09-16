<?php

namespace App\Console\Commands;

use App\Services\InventoryService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:release-expired-reservations')]
#[Description('Release stock reservations whose payment window has expired')]
class ReleaseExpiredReservations extends Command
{
    public function handle(InventoryService $inventoryService): int
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        try {
            $released = $inventoryService->releaseExpiredReservations();
        } finally {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.is_system_bypass = 'off';");
            }
        }

        $this->info("Released {$released} expired inventory reservation(s).");

        return self::SUCCESS;
    }
}
