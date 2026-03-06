<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public User $customer,
        public Product $product,
        public string $customerStatus,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "طلب جديد رقم {$this->order->order_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.order',
            with: [
                'offerCode'      => $this->product->offer->code ?? '-',
                'orderNumber'    => $this->order->order_number,
                'customerName'   => $this->customer->name,
                'customerPhone'  => $this->customer->phone,
                'state'          => $this->customer->state,
                'address'        => $this->customer->address,
                'date'           => $this->order->created_at->format('Y-m-d H:i'),
                'productName'    => $this->product->name_ar,
                'quantity'       => $this->order->quantity,
                'total'          => number_format($this->order->total, 2),
                'marketerFee'    => number_format($this->order->marketer_fee_total, 2),
                'notes'          => $this->order->notes ?? '-',
                'customerStatus' => $this->customerStatus,
            ],
        );
    }
}
