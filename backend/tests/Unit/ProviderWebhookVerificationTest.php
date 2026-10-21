<?php

namespace Tests\Unit;

use App\Services\BiteshipService;
use App\Services\DokuService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProviderWebhookVerificationTest extends TestCase
{
    private const TARGET = '/api/v1/webhooks/doku/notification';

    public function test_doku_rejects_missing_or_wrong_signature(): void
    {
        $service = $this->dokuService();
        $body = json_encode(['order' => ['invoice_number' => 'ORD-1', 'status' => 'PAID']]);
        $requestId = (string) Str::uuid();
        $timestamp = $this->timestamp();
        $signature = $service->generateSignature($requestId, $timestamp, self::TARGET, $body);

        $this->assertFalse($service->verifyWebhookSignature($this->dokuRequest($body)));
        $this->assertFalse($service->verifyWebhookSignature($this->dokuRequest($body, [
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_ID' => $requestId,
            'HTTP_REQUEST_TIMESTAMP' => $timestamp,
            'HTTP_REQUEST_TARGET' => self::TARGET,
            'HTTP_SIGNATURE' => 'wrong-signature',
        ])));
        $this->assertTrue($service->verifyWebhookSignature($this->dokuRequest($body, [
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_ID' => $requestId,
            'HTTP_REQUEST_TIMESTAMP' => $timestamp,
            'HTTP_REQUEST_TARGET' => self::TARGET,
            'HTTP_SIGNATURE' => $signature,
        ])));
    }

    public function test_doku_rejects_stale_timestamp(): void
    {
        $service = $this->dokuService();
        $body = json_encode(['order' => ['invoice_number' => 'ORD-1', 'status' => 'PAID']]);
        $requestId = (string) Str::uuid();
        $stale = now()->subMinutes(30)->setTimezone('UTC')->format('Y-m-d\TH:i:s.v\Z');

        $request = $this->dokuRequest($body, [
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_ID' => $requestId,
            'HTTP_REQUEST_TIMESTAMP' => $stale,
            'HTTP_REQUEST_TARGET' => self::TARGET,
            'HTTP_SIGNATURE' => $service->generateSignature($requestId, $stale, self::TARGET, $body),
        ]);

        $this->assertFalse($service->verifyWebhookSignature($request));
    }

    public function test_doku_acknowledges_valid_unknown_invoice(): void
    {
        $service = $this->dokuService();
        $payload = ['order' => ['invoice_number' => 'DOKU_TEST_ORDER_NOT_FOUND', 'status' => 'PAID', 'amount' => 50000]];
        $content = json_encode($payload);
        $requestId = (string) Str::uuid();
        $timestamp = $this->timestamp();

        $this->call('POST', self::TARGET, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_ID' => $requestId,
            'HTTP_REQUEST_TIMESTAMP' => $timestamp,
            'HTTP_REQUEST_TARGET' => self::TARGET,
            'HTTP_SIGNATURE' => $service->generateSignature($requestId, $timestamp, self::TARGET, $content),
        ], $content)->assertOk()->assertJson(['status' => 'ignored']);
    }

    public function test_doku_rejects_forged_notification(): void
    {
        $this->dokuService();
        $content = json_encode(['order' => ['invoice_number' => 'DOKU_FORGED', 'status' => 'PAID']]);

        $this->call('POST', self::TARGET, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_ID' => (string) Str::uuid(),
            'HTTP_REQUEST_TIMESTAMP' => $this->timestamp(),
            'HTTP_REQUEST_TARGET' => self::TARGET,
            'HTTP_SIGNATURE' => 'forged-signature',
        ], $content)->assertStatus(401);
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

    private function dokuService(): DokuService
    {
        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-webhook-secret',
        ]);

        return new DokuService;
    }

    private function timestamp(): string
    {
        return now()->setTimezone('UTC')->format('Y-m-d\TH:i:s.v\Z');
    }

    private function dokuRequest(string $body, array $server = []): Request
    {
        return Request::create(self::TARGET, 'POST', [], [], [], array_merge([
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_TARGET' => self::TARGET,
            'HTTP_REQUEST_ID' => null,
            'HTTP_REQUEST_TIMESTAMP' => $this->timestamp(),
            'HTTP_SIGNATURE' => null,
        ], $server), $body);
    }
}
