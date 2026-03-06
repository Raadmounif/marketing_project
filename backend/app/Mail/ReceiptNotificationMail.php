<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ReceiptNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public User $customer,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "إيصال تسليم - طلب رقم {$this->order->order_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.receipt',
            with: [
                'orderNumber'   => $this->order->order_number,
                'customerName'  => $this->customer->name,
                'customerPhone' => $this->customer->phone,
                'uploadedAt'    => $this->order->receipt_uploaded_at?->format('Y-m-d H:i'),
                'receiptUrl'    => asset('storage/' . $this->order->receipt_path),
            ],
        );
    }

    public function attachments(): array
    {
        if ($this->order->receipt_path && Storage::disk('public')->exists($this->order->receipt_path)) {
            return [
                Attachment::fromStorageDisk('public', $this->order->receipt_path)
                    ->as('receipt_' . $this->order->order_number . '.' . pathinfo($this->order->receipt_path, PATHINFO_EXTENSION))
                    ->withMime(Storage::disk('public')->mimeType($this->order->receipt_path)),
            ];
        }
        return [];
    }
}
