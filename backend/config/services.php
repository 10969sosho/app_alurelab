<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // [DEPRECATED 2026-10-15] Xendit digantikan DOKU → lihat config/doku.php

    'biteship' => [
        'url' => env('BITESHIP_BASE_URL', env('BITESHIP_API_URL', 'https://api.biteship.com/v1')),
        'key' => env('BITESHIP_API_KEY', ''),
        'webhook_header' => env('BITESHIP_WEBHOOK_HEADER', 'X-Biteship-Webhook-Secret'),
        'webhook_secret' => env('BITESHIP_WEBHOOK_SECRET', ''),
    ],

    'openprovider' => [
        'env' => env('OPENPROVIDER_ENV', 'sandbox'),
        'base_url' => env('OPENPROVIDER_BASE_URL', 'https://api.sandbox.openprovider.nl/v1beta'),
        'username' => env('OPENPROVIDER_USERNAME'),
        'password' => env('OPENPROVIDER_PASSWORD'),
        // IP A record default yang dipasang ke domain merchant (opsional)
        'dns_ip' => env('OPENPROVIDER_DNS_IP', ''),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    ],

    'fonnte' => [
        'token' => env('FONNTE_API_TOKEN'),
        'url' => env('FONNTE_API_URL', 'https://api.fonnte.com/send'),
    ],

    'qa_simulation' => [
        'enabled' => (bool) env('QA_SIMULATION_ENABLED', false),
        'store_slug' => env('QA_SIMULATION_STORE_SLUG', ''),
    ],

];
