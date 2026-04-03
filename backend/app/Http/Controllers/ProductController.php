<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\OfferSection;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request, Offer $offer, ?OfferSection $section = null): JsonResponse
    {
        if ($section !== null && (int) $section->offer_id !== (int) $offer->id) {
            abort(404);
        }

        // Customers cannot browse or order from a disabled offer; staff/admin can (staff routes use auth middleware).
        if (! $offer->is_active) {
            $user = $request->user();
            if (! $user || ! in_array($user->role, ['staff', 'admin'], true)) {
                abort(404);
            }
        }

        $query = $section
            ? $section->products()
            : $offer->products();

        // Staff/admin see all products; customers see only active ones
        if (! $request->user() || $request->user()->role === 'customer') {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        $products = $query->with('offer')->orderBy('created_at', 'desc')->get();

        return response()->json($products);
    }

    public function store(Request $request, Offer $offer, OfferSection $section): JsonResponse
    {
        if ((int) $section->offer_id !== (int) $offer->id) {
            abort(404);
        }

        $data = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'photos' => 'nullable|array',
            'photos.*' => 'nullable|image|max:2048',
            'promo_code' => 'nullable|string|max:50',
            'promo_expiry' => 'nullable|date',
            'promo_discount_percent' => 'nullable|numeric|min:0|max:100',
            'unit_total_price' => 'required|numeric|min:0',
            'marketer_fee_per_unit' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $this->normalizeProductPromoFields($data);
        $promoErr = $this->validateProductPromoConsistency($data);
        if ($promoErr !== null) {
            return response()->json(['message' => $promoErr], 422);
        }

        $photosPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('products', 'public');
                $photosPaths[] = $path;
            }
        }

        if (!array_key_exists('marketer_fee_per_unit', $data) || $data['marketer_fee_per_unit'] === null) {
            $data['marketer_fee_per_unit'] = (float) ($section->marketer_fee_per_unit ?? 0);
        }

        $product = $section->products()->create([
            ...$data,
            'offer_id' => $offer->id,
            'photos' => $photosPaths ?: null,
        ]);

        return response()->json($product->load('offer'), 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'sometimes|string|max:255',
            'promo_code' => 'nullable|string|max:50',
            'promo_expiry' => 'nullable|date',
            'promo_discount_percent' => 'nullable|numeric|min:0|max:100',
            'unit_total_price' => 'sometimes|numeric|min:0',
            'marketer_fee_per_unit' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
            'section_id' => 'sometimes|exists:offer_sections,id',
        ]);

        $this->normalizeProductPromoFields($data);
        $promoErr = $this->validateProductPromoConsistency($data);
        if ($promoErr !== null) {
            return response()->json(['message' => $promoErr], 422);
        }

        if (array_key_exists('section_id', $data)) {
            $newSection = OfferSection::findOrFail($data['section_id']);
            if ((int) $newSection->offer_id !== (int) $product->offer_id) {
                return response()->json(['message' => 'Section must belong to the same offer.'], 422);
            }
            if (!array_key_exists('marketer_fee_per_unit', $data)) {
                $data['marketer_fee_per_unit'] = (float) ($newSection->marketer_fee_per_unit ?? $product->marketer_fee_per_unit);
            }
        }

        if ($request->hasFile('photos')) {
            $request->validate(['photos.*' => 'image|max:2048']);
            $photosPaths = [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('products', 'public');
                $photosPaths[] = $path;
            }
            $data['photos'] = $photosPaths;
        }

        $product->update($data);

        return response()->json($product->fresh()->load('offer'));
    }

    public function toggleActive(Product $product): JsonResponse
    {
        $product->update(['is_active' => ! $product->is_active]);

        return response()->json($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->photos) {
            foreach ($product->photos as $photo) {
                Storage::disk('public')->delete($photo);
            }
        }
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }

    public function bulkUpdate(Request $request, Offer $offer): JsonResponse
    {
        $data = $request->validate([
            'field' => 'required|in:unit_total_price,marketer_fee_per_unit',
            'percentage' => 'required|numeric',
        ]);

        $products = $offer->products;
        $field = $data['field'];
        $percentage = $data['percentage'];

        foreach ($products as $product) {
            $currentValue = $product->{$field};
            $newValue = $currentValue * (1 + $percentage / 100);
            $newValue = max(0, round($newValue, 2));
            $product->update([$field => $newValue]);
        }

        return response()->json([
            'message' => 'Bulk update applied.',
            'products' => $offer->fresh()->products,
        ]);
    }

    public function bulkUpdateSection(Request $request, Offer $offer, OfferSection $section): JsonResponse
    {
        if ((int) $section->offer_id !== (int) $offer->id) {
            abort(404);
        }

        $data = $request->validate([
            'field' => 'required|in:unit_total_price,marketer_fee_per_unit',
            'percentage' => 'required|numeric',
        ]);

        $products = $section->products;
        $field = $data['field'];
        $percentage = $data['percentage'];

        foreach ($products as $product) {
            $currentValue = $product->{$field};
            $newValue = $currentValue * (1 + $percentage / 100);
            $newValue = max(0, round($newValue, 2));
            $product->update([$field => $newValue]);
        }

        return response()->json([
            'message' => 'Bulk update applied.',
            'products' => $section->fresh()->products,
        ]);
    }

    private function normalizeProductPromoFields(array &$data): void
    {
        foreach (['promo_code', 'promo_expiry'] as $k) {
            if (array_key_exists($k, $data) && ($data[$k] === '' || $data[$k] === null)) {
                $data[$k] = null;
            }
        }
        if (array_key_exists('promo_discount_percent', $data)
            && ($data['promo_discount_percent'] === '' || $data['promo_discount_percent'] === null)) {
            $data['promo_discount_percent'] = null;
        }
        if (array_key_exists('promo_code', $data) && empty($data['promo_code'])) {
            $data['promo_code'] = null;
            $data['promo_expiry'] = null;
            $data['promo_discount_percent'] = null;
        }
    }

    private function validateProductPromoConsistency(array $data): ?string
    {
        if (! array_key_exists('promo_code', $data) || empty($data['promo_code'])) {
            return null;
        }
        if (empty($data['promo_expiry'])) {
            return 'Promo expiry is required when a promo code is set.';
        }
        if (($data['promo_discount_percent'] ?? null) === null || (float) $data['promo_discount_percent'] <= 0) {
            return 'Promo discount percent must be greater than 0 when a promo code is set.';
        }
        if (\Carbon\Carbon::parse($data['promo_expiry'])->endOfDay()->isPast()) {
            return 'Promo expiry must be in the future.';
        }

        return null;
    }
}
