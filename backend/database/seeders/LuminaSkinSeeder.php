<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LuminaSkinSeeder extends Seeder
{
    public function run(): void
    {
        $usesPostgres = DB::getDriverName() === 'pgsql';

        if ($usesPostgres) {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        try {
            DB::transaction(function (): void {
                $user = User::updateOrCreate(
                    ['email' => 'lumina@alurelab.com'],
                    [
                        'name' => 'Lumina Derma Lab',
                        'password_hash' => Hash::make('password123'),
                    ]
                );
                $user->forceFill(['email_verified_at' => now()])->save();

                $store = Store::updateOrCreate(
                    ['slug' => 'lumina-skin'],
                    [
                        'name' => 'Lumina Derma Lab Official',
                        'phone_number' => '081234567893',
                        'address_area_id' => 'ID_ID_3171_317101',
                        'address_detail' => 'Jl. Kemang Raya, Kemang, Jakarta Selatan',
                        'logo_url' => 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=85',
                        'settings' => [
                            'tagline' => 'Clinical Skin Formulation & Clean Beauty',
                            'primary_color' => '#0F172A',
                            'accent_color' => '#06B6D4',
                            'branding' => [
                                'storeName' => 'Lumina Derma Lab Official',
                                'tagline' => 'Clinical Skin Formulation & Clean Beauty',
                                'primaryColor' => '#0F172A',
                                'accentColor' => '#06B6D4',
                            ],
                        ],
                    ]
                );

                StoreUser::updateOrCreate(
                    ['store_id' => $store->id, 'user_id' => $user->id],
                    ['role' => 'owner']
                );

                $products = [
                    [
                        'title' => 'Lumina Barrier Repair Ceramide Cleanser',
                        'slug' => 'lumina-barrier-repair-ceramide-cleanser',
                        'category_name' => 'Cleanser',
                        'description' => 'Pembersih wajah ber-pH seimbang dengan ceramide dan gliserin untuk mengangkat sunscreen, minyak, dan kotoran tanpa membuat kulit terasa tertarik. Formulanya lembut untuk pemakaian harian, termasuk pada kulit kering dan sensitif.',
                        'price' => 289000,
                        'compare_at_price' => 329000,
                        'weight_grams' => 250,
                        'image' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1400&auto=format&fit=crop&q=85',
                        'variants' => [
                            ['title' => '100ml', 'sku' => 'LUM-CLN-100', 'price' => 289000, 'stock' => 48],
                            ['title' => '200ml', 'sku' => 'LUM-CLN-200', 'price' => 429000, 'stock' => 32],
                        ],
                    ],
                    [
                        'title' => 'Lumina 10% Niacinamide + Zinc Brightening Serum',
                        'slug' => 'lumina-10-niacinamide-zinc-brightening-serum',
                        'category_name' => 'Serum',
                        'description' => 'Serum konsentrat dengan 10% niacinamide dan zinc PCA untuk membantu menyamarkan tampilan noda, meratakan rona kulit, serta mengontrol kilap. Gunakan bertahap pada kulit bersih dan lanjutkan dengan pelembap serta sunscreen pada pagi hari.',
                        'price' => 379000,
                        'compare_at_price' => 429000,
                        'weight_grams' => 120,
                        'image' => 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=1400&auto=format&fit=crop&q=85',
                        'variants' => [
                            ['title' => '30ml', 'sku' => 'LUM-NIA-030', 'price' => 379000, 'stock' => 40],
                            ['title' => '50ml', 'sku' => 'LUM-NIA-050', 'price' => 529000, 'stock' => 26],
                        ],
                    ],
                    [
                        'title' => 'Lumina Retinoid Night Renewal Elixir',
                        'slug' => 'lumina-retinoid-night-renewal-elixir',
                        'category_name' => 'Serum',
                        'description' => 'Eliksir malam dengan retinoid untuk membantu memperbaiki tampilan tekstur dan garis halus secara bertahap. Mulai dari dua malam per minggu pada kulit kering, hindari area mata, dan gunakan sunscreen setiap pagi. Tidak direkomendasikan selama kehamilan atau menyusui.',
                        'price' => 489000,
                        'compare_at_price' => 549000,
                        'weight_grams' => 100,
                        'image' => 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1400&auto=format&fit=crop&q=85',
                        'variants' => [
                            ['title' => '20ml', 'sku' => 'LUM-RET-020', 'price' => 489000, 'stock' => 24],
                        ],
                    ],
                    [
                        'title' => 'Lumina Hydro-Plump Hyaluronic Acid Gel Cream',
                        'slug' => 'lumina-hydro-plump-hyaluronic-acid-gel-cream',
                        'category_name' => 'Moisturizer',
                        'description' => 'Gel cream ringan dengan multi-molecular hyaluronic acid, panthenol, dan squalane untuk membantu menjaga hidrasi serta mendukung kenyamanan skin barrier. Cepat meresap dengan hasil akhir lembap tanpa rasa berat.',
                        'price' => 429000,
                        'compare_at_price' => 479000,
                        'weight_grams' => 150,
                        'image' => 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1400&auto=format&fit=crop&q=85',
                        'variants' => [
                            ['title' => '50g', 'sku' => 'LUM-HYD-050', 'price' => 429000, 'stock' => 36],
                        ],
                    ],
                    [
                        'title' => 'Lumina Invisible UV Shield SPF 50+ PA++++',
                        'slug' => 'lumina-invisible-uv-shield-spf-50-pa++++',
                        'category_name' => 'Sunscreen',
                        'description' => 'Sunscreen broad-spectrum SPF 50+ PA++++ dengan tekstur ringan dan hasil akhir transparan tanpa white cast yang terlihat. Aplikasikan merata sebagai langkah terakhir perawatan pagi dan ulangi pemakaian setiap dua jam saat terpapar matahari.',
                        'price' => 359000,
                        'compare_at_price' => 399000,
                        'weight_grams' => 120,
                        'image' => 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=1400&auto=format&fit=crop&q=85',
                        'variants' => [
                            ['title' => '50ml', 'sku' => 'LUM-UVS-050', 'price' => 359000, 'stock' => 52],
                        ],
                    ],
                    [
                        'title' => 'Lumina Peptide Glow Eye Treatment',
                        'slug' => 'lumina-peptide-glow-eye-treatment',
                        'category_name' => 'Eye Care',
                        'description' => 'Perawatan area mata dengan peptide complex, caffeine, dan humektan untuk membantu menjaga kelembapan serta menyegarkan tampilan area bawah mata. Aplikasikan tipis dengan tekanan lembut; hindari kontak langsung dengan mata.',
                        'price' => 449000,
                        'compare_at_price' => 499000,
                        'weight_grams' => 80,
                        'image' => 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=1400&auto=format&fit=crop&q=85',
                        'variants' => [
                            ['title' => '15ml', 'sku' => 'LUM-EYE-015', 'price' => 449000, 'stock' => 28],
                        ],
                    ],
                ];

                foreach ($products as $item) {
                    $product = Product::updateOrCreate(
                        ['tenant_id' => $store->id, 'slug' => $item['slug']],
                        [
                            'title' => $item['title'],
                            'category_name' => $item['category_name'],
                            'description' => $item['description'],
                            'price' => $item['price'],
                            'compare_at_price' => $item['compare_at_price'],
                            'weight_grams' => $item['weight_grams'],
                            'images' => [$item['image']],
                            'is_active' => true,
                        ]
                    );

                    foreach ($item['variants'] as $variant) {
                        ProductVariant::updateOrCreate(
                            [
                                'tenant_id' => $store->id,
                                'product_id' => $product->id,
                                'title' => $variant['title'],
                            ],
                            [
                                'sku' => $variant['sku'],
                                'price' => $variant['price'],
                                'stock' => $variant['stock'],
                            ]
                        );
                    }
                }
            });
        } finally {
            if ($usesPostgres) {
                DB::statement("SET app.is_system_bypass = 'off';");
            }
        }

        $this->command?->info('Lumina Derma Lab Official berhasil disiapkan dengan 6 produk skincare.');
    }
}
