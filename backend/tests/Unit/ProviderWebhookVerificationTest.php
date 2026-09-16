<?php

namespace Tests\Unit;

use App\Services\BiteshipService;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Tests\TestCase;

class ProviderWebhookVerificationTest extends TestCase
{
    public function test_xendit_rejects_missing_or_wrong_callback_token(): void
    {
        config([
            'services.xendit.secret_key' => 'xnd_development_test',
            'services.xendit.webhook_token' => 'xendit-webhook-secret',
        ]);

        $service = new XenditService;

        $this->assertFalse($service->verifyWebhookSignature(null));
        $this->assertFalse($service->verifyWebhookSignature('wrong-token'));
        $this->assertTrue($service->verifyWebhookSignature('xendit-webhook-secret'));
    }

    public function test_biteship_rejects_missing_or_wrong_signature(): void
    {
        config([
            'services.biteship.key' => 'biteship_test',
            'services.biteship.webhook_header' => 'X-Biteship-Signature',
            'services.biteship.webhook_secret' => 'biteship-webhook-secret',
        ]);

        $service = new BiteshipService;

        $this->assertFalse($service->verifyWebhookSignature(Request::create('/')));
        $this->assertFalse($service->verifyWebhookSignature(Request::create('/', 'POST', [], [], [], [
            'HTTP_X_BITESHIP_SIGNATURE' => 'wrong-secret',
        ])));
        $this->assertTrue($service->verifyWebhookSignature(Request::create('/', 'POST', [], [], [], [
            'HTTP_X_BITESHIP_SIGNATURE' => 'biteship-webhook-secret',
        ])));
    }
}
