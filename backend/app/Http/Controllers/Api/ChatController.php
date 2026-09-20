<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════════════
    // BUYER ENDPOINTS (customer auth via X-Customer-Token or session)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /v1/chat/start
     * Buyer memulai conversation dengan store.
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'store_slug' => 'required|string',
            'message'    => 'required|string|max:2000',
        ]);

        $store = Store::where('slug', $request->store_slug)->firstOrFail();
        $customer = $this->getOrCreateBuyer($request);

        $conversation = DB::transaction(function () use ($store, $customer, $request) {
            $conv = Conversation::firstOrCreate(
                ['store_id' => $store->id, 'customer_id' => $customer->id],
                ['last_message_at' => now(), 'unread_seller' => 0, 'unread_buyer' => 0]
            );

            Message::create([
                'conversation_id' => $conv->id,
                'sender_type'     => 'buyer',
                'sender_id'       => $customer->id,
                'body'            => $request->message,
            ]);

            $conv->update([
                'last_message_at' => now(),
                'unread_seller'   => $conv->unread_seller + 1,
            ]);

            return $conv;
        });

        return response()->json([
            'message'        => 'Conversation started',
            'data'           => $conversation->load('messages'),
            'customer_token' => $customer->id,
        ], 201);
    }

    /**
     * GET /v1/chat/conversations?store_slug=xxx
     * Buyer: lihat conversations mereka dengan store tertentu.
     * Seller: lihat semua conversations di toko mereka.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveSeller($request);

        if ($user) {
            // Seller flow — lihat semua conv di store mereka
            $store = $user->stores()->first();
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

        // Buyer flow
        $customer = $this->resolveCustomer($request);
        if (! $customer) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $conversations = Conversation::where('customer_id', $customer->id)
            ->with(['store', 'latestMessage'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn ($c) => $this->formatConversation($c, 'buyer'));

        return response()->json(['data' => $conversations]);
    }

    /**
     * GET /v1/chat/conversations/{id}/messages
     * Ambil semua messages dalam sebuah conversation.
     */
    public function messages(Request $request, string $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);
        $this->authorizeConversation($conversation, $request);

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read
        $senderType = $this->resolveSeller($request) ? 'seller' : 'buyer';
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
     * Kirim pesan dalam conversation.
     */
    public function send(Request $request, string $id): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:2000']);

        $conversation = Conversation::findOrFail($id);
        $this->authorizeConversation($conversation, $request);

        $user = $this->resolveSeller($request);
        $senderType = $user ? 'seller' : 'buyer';
        $senderId   = $user
            ? $user->id
            : $this->resolveCustomer($request)?->id;

        if (! $senderId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $message = DB::transaction(function () use ($conversation, $senderType, $senderId, $request) {
            $msg = Message::create([
                'conversation_id' => $conversation->id,
                'sender_type'     => $senderType,
                'sender_id'       => $senderId,
                'body'            => $request->body,
            ]);

            $conversation->update([
                'last_message_at' => now(),
                'unread_seller'   => $senderType === 'buyer'  ? $conversation->unread_seller + 1 : $conversation->unread_seller,
                'unread_buyer'    => $senderType === 'seller' ? $conversation->unread_buyer  + 1 : $conversation->unread_buyer,
            ]);

            return $msg;
        });

        return response()->json(['data' => $message], 201);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private function resolveSeller(Request $request): ?\App\Models\User
    {
        return auth('sanctum')->setRequest($request)->user() ?: Auth::user();
    }

    private function resolveCustomer(Request $request): ?Customer
    {
        // 1. Cek Sanctum bearer token jika buyer login via CustomerAuthController
        $sanctumUser = auth('sanctum')->setRequest($request)->user();
        if ($sanctumUser instanceof Customer) {
            return $sanctumUser;
        }

        // 2. Cek X-Customer-Token header atau cookie (bisa berupa customer ID atau custom token)
        $token = $request->header('X-Customer-Token') ?? $request->cookie('customer_token');
        if ($token) {
            // Bisa format UUID customer
            if (\Illuminate\Support\Str::isUuid($token)) {
                $customer = Customer::find($token);
                if ($customer) return $customer;
            }
        }

        return null;
    }

    private function getOrCreateBuyer(Request $request): Customer
    {
        $customer = $this->resolveCustomer($request);
        if ($customer) {
            return $customer;
        }

        // Buat guest customer baru secara otomatis (Instant Guest Chat)
        $guestNumber = 'GUEST_' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8));
        return Customer::create([
            'phone_number' => $guestNumber,
            'full_name' => 'Tamu ' . substr($guestNumber, -4),
            'default_address' => [],
        ]);
    }

    private function authorizeConversation(Conversation $conv, Request $request): void
    {
        $user = $this->resolveSeller($request);

        if ($user) {
            // Seller: must own the store
            $storeIds = $user->stores()->pluck('id');
            abort_unless($storeIds->contains($conv->store_id), 403, 'Forbidden');
            return;
        }

        // Buyer: must match customer or allow if token matches
        $customer = $this->resolveCustomer($request);
        if ($customer) {
            abort_unless($customer->id === $conv->customer_id, 403, 'Forbidden');
        }
    }

    private function formatConversation(Conversation $conv, string $viewAs): array
    {
        return [
            'id'              => $conv->id,
            'last_message_at' => $conv->last_message_at,
            'unread'          => $viewAs === 'seller' ? $conv->unread_seller : $conv->unread_buyer,
            'counterpart'     => $viewAs === 'seller'
                ? ['name' => $conv->customer?->full_name, 'id' => $conv->customer_id]
                : ['name' => $conv->store?->name, 'slug' => $conv->store?->slug, 'id' => $conv->store_id],
            'latest_message'  => $conv->latestMessage->first()?->body,
        ];
    }
}
