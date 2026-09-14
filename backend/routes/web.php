<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'ALURELAB Core API Engine',
        'status' => 'operational',
        'version' => '1.0.0',
        'php' => PHP_VERSION,
        'documentation' => '/docs',
    ]);
});
