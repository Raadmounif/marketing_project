<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Statistic;
use App\Models\User;
use App\Mail\OrderNotificationMail;
use App\Mail\ReceiptNotificationMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1',
            'notes'      => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (!$user->state || !$user->address) {
            return response()->json([
                'message' => 'Please complete your profile (state and address) before ordering.',
            ], 422);
        }

        $product = Product::with('offer')->findOrFail($data['product_id']);

        if (!$product->is_active) {
            return response()->json(['message' => 'This product is currently unavailable.'], 422);
        }

        $promoDiscount = 0;

        if ($product->isPromoValid()) {
            $promoDiscount = $product->promo_discount ?? 0;
        }

        // Delivery cost = state_extra from the offer's fee schedule for the customer's state
        $schedule = $product->offer->marketer_fee_schedule;
        $deliveryCost = (float) ($schedule['state_extras'][$user->state] ?? 0);

        $total = ($data['quantity'] * $product->unit_total_price) + $deliveryCost - $promoDiscount;
        $total = max(0, $total);
        $marketerFeeTotal = $product->offer->calculateMarketerFee(
            $data['quantity'],
            $user->state,
            $product->marketer_fee_per_unit
        );
        $deliveryDate = now()->addDays(2)->toDateString();

        $order = DB::transaction(function () use ($data, $user, $product, $total, $marketerFeeTotal, $deliveryDate) {
            $orderNumber = Order::generateOrderNumber();

            return Order::create([
                'order_number'       => $orderNumber,
                'user_id'            => $user->id,
                'product_id'         => $product->id,
                'quantity'           => $data['quantity'],
                'notes'              => $data['notes'] ?? null,
                'total'              => $total,
                'marketer_fee_total' => $marketerFeeTotal,
                'delivery_date'      => $deliveryDate,
                'status'             => 'ordered',
            ]);
        });

        // Determine if new or returning customer
        $ordersCount = $user->orders()->count();
        $customerStatus = $ordersCount <= 1 ? 'جديد' : 'قديم';

        // Send order notification email
        try {
            $notificationEmail = \App\Models\Setting::get('notification_email', 'raadmunif2@gmail.com');
            Mail::to($notificationEmail)->send(new OrderNotificationMail(
                $order, $user, $product, $customerStatus
            ));
        } catch (\Exception $e) {
            \Log::error('Order email failed: ' . $e->getMessage());
        }

        return response()->json($order->load('product.offer'), 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('product.offer')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function index(Request $request): JsonResponse
    {
        $orders = Order::with('product.offer', 'user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function destroy(Request $request, Order $order): JsonResponse
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted.']);
    }

    public function toggleCommission(Request $request, Order $order): JsonResponse
    {
        $order->update(['commission_collected' => !$order->commission_collected]);
        return response()->json($order->fresh()->load('product.offer', 'user'));
    }

    public function submitFeedback(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'feedback' => 'required|string|max:1000',
        ]);

        $order->update(['feedback' => $data['feedback']]);

        return response()->json($order->fresh()->load('product.offer'));
    }

    public function uploadReceipt(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($order->status === 'delivered') {
            return response()->json(['message' => 'Receipt already uploaded.'], 422);
        }

        $request->validate([
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $path = $request->file('receipt')->store('receipts', 'public');

        $order->update([
            'receipt_path'        => $path,
            'receipt_uploaded_at' => now(),
            'status'              => 'delivered',
        ]);

        // Update statistics
        Statistic::record($order->total, $order->marketer_fee_total);

        // Send receipt notification email
        try {
            $notificationEmail = \App\Models\Setting::get('notification_email', 'raadmunif2@gmail.com');
            Mail::to($notificationEmail)->send(new ReceiptNotificationMail($order, $order->user));
        } catch (\Exception $e) {
            \Log::error('Receipt email failed: ' . $e->getMessage());
        }

        return response()->json($order->fresh()->load('product.offer'));
    }
}
