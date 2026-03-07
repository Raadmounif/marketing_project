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
use Illuminate\Support\Facades\Http;
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

        if (!$product->offer) {
            return response()->json(['message' => 'This product is not linked to an offer. Please contact support.'], 422);
        }

        $promoDiscount = 0;

        if ($product->isPromoValid()) {
            $promoDiscount = $product->promo_discount ?? 0;
        }

        // Delivery fee = qty_fee + state_extra (for 5+ units: qty_fee=0, state_extra still applies)
        $deliveryCost = $product->offer->getDeliveryFeeForOrder($data['quantity'], $user->state ?? '');

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
        $notificationEmail = \App\Models\Setting::get('notification_email', 'raadmunif2@gmail.com');
        $subject = "طلب جديد رقم {$order->order_number}";
        $sent = false;

        try {
            Mail::to($notificationEmail)->send(new OrderNotificationMail(
                $order, $user, $product, $customerStatus
            ));
            $sent = true;
        } catch (\Throwable $e) {
            \Log::error('Order email failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace'     => $e->getTraceAsString(),
                'order_id'  => $order->id,
                'order_number' => $order->order_number,
                'to'        => $notificationEmail,
                'customer'  => $user->name . ' / ' . $user->phone,
                'total'     => $order->total,
            ]);
        }

        // Fallback: send via Resend API if Laravel mail failed and API key is set
        if (!$sent && env('RESEND_API_KEY')) {
            try {
                $body = view('emails.order', [
                    'orderNumber'    => $order->order_number,
                    'offerCode'      => $product->offer->code ?? '-',
                    'date'           => $order->created_at->format('Y-m-d H:i'),
                    'customerName'   => $user->name,
                    'customerPhone'  => $user->phone,
                    'state'          => $user->state,
                    'address'        => $user->address,
                    'customerStatus' => $customerStatus,
                    'productName'    => $product->name_ar,
                    'quantity'       => $order->quantity,
                    'total'          => number_format($order->total, 2),
                    'marketerFee'    => number_format($order->marketer_fee_total, 2),
                    'notes'          => $order->notes ?? '-',
                ])->render();
                // Resend allows onboarding@resend.dev without domain verification
                $resend = self::sendViaResend($notificationEmail, $subject, $body, 'onboarding@resend.dev', 'Tobacco Market');
                $sent = $resend;
            } catch (\Throwable $e) {
                \Log::error('Resend fallback failed: ' . $e->getMessage());
            }
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
        // Delete receipt file from storage if present
        if ($order->receipt_path) {
            try {
                Storage::disk('public')->delete($order->receipt_path);
            } catch (\Throwable $e) {
                \Log::warning('Could not delete order receipt file: ' . $e->getMessage());
            }
        }

        // If order was delivered, it contributed to statistics — decrement aggregates
        if ($order->status === 'delivered') {
            $stat = Statistic::first();
            if ($stat) {
                $stat->decrement('successful_orders_count');
                $stat->decrement('cumulative_total', round($order->total, 2));
                $stat->decrement('cumulative_marketer_fee', round($order->marketer_fee_total, 2));
            }
        }

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

    /**
     * Send email via Resend API (fallback when Laravel mail fails).
     */
    private static function sendViaResend(string $to, string $subject, string $text, string $fromAddress, string $fromName): bool
    {
        $key = env('RESEND_API_KEY');
        if (!$key) {
            return false;
        }
        $response = Http::withToken($key)->post('https://api.resend.com/emails', [
            'from'    => $fromName . ' <' . $fromAddress . '>',
            'to'      => [$to],
            'subject' => $subject,
            'text'    => $text,
        ]);
        return $response->successful();
    }
}
