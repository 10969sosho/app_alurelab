<?php

namespace Tests\Unit;

use App\Services\BiteshipService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BiteshipServiceTest extends TestCase
{
    public function test_fallback_rates_change_with_billable_weight_and_destination_region(): void
    {
        config([
            'services.biteship.key' => '',
            'services.qa_simulation.enabled' => false,
        ]);

        $service = new BiteshipService;
        $origin = 'ID_ID_3171_317101';
        $items = [['name' => 'Item', 'value' => 10000, 'quantity' => 1, 'weight' => 500]];
        $local = $service->calculateRates($origin, $origin, $items);
        $heavier = $service->calculateRates($origin, $origin, [
            ['name' => 'Item', 'value' => 10000, 'quantity' => 3, 'weight' => 500],
        ]);
        $interProvince = $service->calculateRates('ID_ID_3273_327301', $origin, $items);

        $this->assertGreaterThan($local[0]['price'], $heavier[0]['price']);
        $this->assertGreaterThan($local[0]['price'], $interProvince[0]['price']);
        $this->assertSame('regular', $local[0]['type']);
        $this->assertSame('cargo', $local[1]['type']);
        $this->assertTrue($local[0]['estimated']);
    }

    public function test_biteship_rates_are_used_when_provider_returns_them(): void
    {
        config([
            'services.biteship.key' => 'test-key',
            'services.biteship.url' => 'https://api.biteship.test/v1',
            'services.qa_simulation.enabled' => false,
        ]);

        $pricing = [[
            'courier_code' => 'jne',
            'courier_service_code' => 'reg',
            'price' => 12345,
        ]];
        Http::fake(['*rates/couriers' => Http::response(['pricing' => $pricing])]);

        $rates = (new BiteshipService)->calculateRates(
            'ID_ID_3171_317101',
            'ID_ID_3171_317102',
            [['name' => 'Item', 'value' => 10000, 'quantity' => 1, 'weight' => 500]],
        );

        $this->assertSame($pricing, $rates);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/rates/couriers'));
    }
}
