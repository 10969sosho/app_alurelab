<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * POST /v1/chat/start
     * Buyer (wajib terotentikasi sebagai Customer) memulai conversation dengan store.
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'store_slug' => 'required|string',
            'message' => 'required|string|max:2000',
        ]);

        $actor = $this->resolveActor($request);
        if (! ($actor['user'] instanceof Customer)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda harus login sebagai pembeli untuk memulai percakapan.',
            ], 401);
        }

        $customer = $actor['user'];
        $store = Store::where('slug', $request->store_slug)->firstOrFail();

        $conversation = DB::transaction(function () use ($store, $customer, $request) {
            $conv = Conversation::firstOrCreate(
                ['store_id' => $store->id, 'customer_id' => $customer->id],
                ['last_message_at' => now(), 'unread_seller' => 0, 'unread_buyer' => 0]
            );

            Message::create([
                'conversation_id' => $conv->id,
                'sender_type' => 'buyer',
                'sender_id' => $customer->id,
                'body' => $request->message,
            ]);

            $conv->update([
                'last_message_at' => now(),
                'unread_seller' => $conv->unread_seller + 1,
            ]);

            return $conv;
        });

        return response()->json([
            'success' => true,
            'message' => 'Conversation started',
            'data' => $conversation->load('messages'),
            'customer_token' => $customer->id,
        ], 201);
    }

    /**
     * GET /v1/chat/conversations?store_slug=xxx
     * Buyer: lihat conversations milik customer yang sedang login (bisa difilter store_slug).
     * Seller: lihat semua conversations di toko mereka.
     */
    public function index(Request $request): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $actor['user']) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($actor['type'] === 'seller') {
            /** @var User $seller */
            $seller = $actor['user'];

            // Prioritas store: explicit header/query atau store milik seller
            $store = null;
            if ($request->has('store_slug')) {
                $store = $seller->stores()->where('slug', $request->query('store_slug'))->first();
            }
            if (! $store && $request->header('X-Store-Slug')) {
                $store = $seller->stores()->where('slug', $request->header('X-Store-Slug'))->first();
            }
            if (! $store) {
                $store = $seller->stores()->first();
            }

            if (! $store) {
                return response()->json(['data' => []]);
            }

            $conversations = Conversation::where('store_id', $store->id)
                ->with(['customer', 'latestMessage'])
                ->orderByDesc('last_message_at')
                ->get()
                ->map(fn ($c) => $this->formatConversation($c, 'seller'));

            return response()->json(['data' => $conversations]);
        }

        // Buyer flow — STRICTLY ISOLATED to authenticated customer
        /** @var Customer $customer */
        $customer = $actor['user'];
        $query = Conversation::where('customer_id', $customer->id)
            ->with(['store', 'latestMessage'])
            ->orderByDesc('last_message_at');

        if ($request->has('store_slug')) {
            $query->whereHas('store', function ($q) use ($request) {
                $q->where('slug', $request->query('store_slug'));
            });
        }

        $conversations = $query->get()->map(fn ($c) => $this->formatConversation($c, 'buyer'));

        return response()->json(['data' => $conversations]);
    }

    /**
     * GET /v1/chat/conversations/{id}/messages
     * Ambil semua messages dalam conversation dengan verifikasi otorisasi ketat.
     */
    public function messages(Request $request, string $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);
        $actor = $this->authorizeConversation($conversation, $request);

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read
        $senderType = $actor['type'];
        Message::where('conversation_id', $id)
            ->where('sender_type', '!=', $senderType)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Reset unread counter
        if ($senderType === 'seller') {
            $conversation->update(['unread_seller' => 0]);
        } else {
            $conversation->update(['unread_buyer' => 0]);
        }

        return response()->json(['data' => $messages]);
    }

    /**
     * POST /v1/chat/conversations/{id}/messages
     * Kirim pesan dalam conversation dengan verifikasi otorisasi ketat.
     */
    public function send(Request $request, string $id): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:2000']);

        $conversation = Conversation::findOrFail($id);
        $actor = $this->authorizeConversation($conversation, $request);

        $senderType = $actor['type'];
        $senderId = $actor['user']->id;

        $message = DB::transaction(function () use ($conversation, $senderType, $senderId, $request) {
            $msg = Message::create([
                'conversation_id' => $conversation->id,
                'sender_type' => $senderType,
                'sender_id' => $senderId,
                'body' => $request->body,
            ]);

            $conversation->update([
                'last_message_at' => now(),
                'unread_seller' => $senderType === 'buyer' ? $conversation->unread_seller + 1 : $conversation->unread_seller,
                'unread_buyer' => $senderType === 'seller' ? $conversation->unread_buyer + 1 : $conversation->unread_buyer,
            ]);

            return $msg;
        });

        return response()->json(['data' => $message], 201);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS & SECURITY
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Resolves authenticated user via Sanctum guard.
     * Returns ['type' => 'seller'|'buyer', 'user' => User|Customer] or ['type' => null, 'user' => null]
     */
    private function resolveActor(Request $request): array
    {
        $sanctumUser = auth('sanctum')->setRequest($request)->user();

        if ($sanctumUser instanceof User) {
            return ['type' => 'seller', 'user' => $sanctumUser];
        }

        if ($sanctumUser instanceof Customer) {
            return ['type' => 'buyer', 'user' => $sanctumUser];
        }

        return ['type' => null, 'user' => null];
    }

    /**
     * Memastikan akses percakapan benar-benar terisolasi:
     * - Seller hanya boleh membaca percakapan di tokonya.
     * - Buyer hanya boleh membaca percakapan miliknya sendiri.
     * - Semua akses tanpa login ditolak 401.
     * - Akses silang ditolak 403.
     */
    private function authorizeConversation(Conversation $conv, Request $request): array
    {
        $actor = $this->resolveActor($request);

        if (! $actor['user']) {
            abort(response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Sesi login diperlukan.',
            ], 401));
        }

        if ($actor['type'] === 'seller') {
            /** @var User $seller */
            $seller = $actor['user'];
            $storeIds = $seller->stores()->pluck('stores.id');
            abort_unless($storeIds->contains($conv->store_id), 403, 'Akses percakapan ditolak: Toko bukan milik Anda.');

            return $actor;
        }

        if ($actor['type'] === 'buyer') {
            /** @var Customer $customer */
            $customer = $actor['user'];
            abort_unless($customer->id === $conv->customer_id, 403, 'Akses percakapan ditolak: Percakapan ini milik pembeli lain.');

            return $actor;
        }

        abort(403, 'Forbidden');
    }

    private function formatConversation(Conversation $conv, string $viewAs): array
    {
        return [
            'id' => $conv->id,
            'last_message_at' => $conv->last_message_at,
            'unread' => $viewAs === 'seller' ? $conv->unread_seller : $conv->unread_buyer,
            'counterpart' => $viewAs === 'seller'
                ? ['name' => $conv->customer?->full_name, 'id' => $conv->customer_id, 'phone' => $conv->customer?->phone_number]
                : ['name' => $conv->store?->name, 'slug' => $conv->store?->slug, 'id' => $conv->store_id],
            'latest_message' => $conv->latestMessage->first()?->body,
        ];
    }
}
