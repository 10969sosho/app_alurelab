<?php

use App\Http\Middleware\EnsureStoreRole;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('app:release-expired-reservations')->everyMinute();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['store.role' => EnsureStoreRole::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Selalu return JSON untuk semua request ke /api/*
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
