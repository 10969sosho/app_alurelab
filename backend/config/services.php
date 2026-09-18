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

    'xendit' => [
        'secret_key' => env('XENDIT_SECRET_KEY', ''),
        'public_key' => env('XENDIT_PUBLIC_KEY', ''),
        'webhook_token' => env('XENDIT_WEBHOOK_TOKEN', ''),
        'invoice_expiry_minutes' => (int) env('XENDIT_INVOICE_EXPIRY_MINUTES', 1440),
    ],

    'biteship' => [
        'url' => env('BITESHIP_API_URL', 'https://api.biteship.com/v1'),
        'key' => env('BITESHIP_API_KEY', ''),
        'webhook_header' => env('BITESHIP_WEBHOOK_HEADER', 'X-Biteship-Webhook-Secret'),
        'webhook_secret' => env('BITESHIP_WEBHOOK_SECRET', ''),
    ],

    'qa_simulation' => [
        'enabled' => (bool) env('QA_SIMULATION_ENABLED', false),
        'store_slug' => env('QA_SIMULATION_STORE_SLUG', ''),
    ],

];
