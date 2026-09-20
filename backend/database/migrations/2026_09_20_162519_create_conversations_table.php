<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('store_id');
            $table->uuid('customer_id');
            $table->timestamp('last_message_at')->nullable();
            $table->integer('unread_seller')->default(0);  // unread count for seller
            $table->integer('unread_buyer')->default(0);   // unread count for buyer
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->unique(['store_id', 'customer_id']);
            $table->index(['store_id', 'last_message_at']);
            $table->index(['customer_id', 'last_message_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};

