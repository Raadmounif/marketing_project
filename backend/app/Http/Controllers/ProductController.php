<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request, Offer $offer): JsonResponse
    {
        $query = $offer->products();

        // Staff/admin see all products; customers see only active ones
        if (!$request->user() || $request->user()->role === 'customer') {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        return response()->json($products);
    }

    public function store(Request $request, Offer $offer): JsonResponse
    {
        $data = $request->validate([
            'name_ar'              => 'required|string|max:255',
            'name_en'              => 'required|string|max:255',
            'photos'               => 'nullable|array',
            'photos.*'             => 'nullable|image|max:2048',
            'promo_code'           => 'nullable|string|max:50',
            'promo_expiry'         => 'nullable|date|after:today',
            'promo_discount'       => 'nullable|numeric|min:0',
            'unit_total_price'     => 'required|numeric|min:0',
            'marketer_fee_per_unit' => 'required|numeric|min:0',
            'is_active'            => 'boolean',
        ]);

        $photosPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('products', 'public');
                $photosPaths[] = $path;
            }
        }

        $product = $offer->products()->create([
            ...$data,
            'photos' => $photosPaths ?: null,
        ]);

        return response()->json($product->load('offer'), 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'name_ar'              => 'sometimes|string|max:255',
            'name_en'              => 'sometimes|string|max:255',
            'promo_code'           => 'nullable|string|max:50',
            'promo_expiry'         => 'nullable|date',
            'promo_discount'       => 'nullable|numeric|min:0',
            'unit_total_price'     => 'sometimes|numeric|min:0',
            'marketer_fee_per_unit' => 'sometimes|numeric|min:0',
            'is_active'            => 'sometimes|boolean',
        ]);

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
        $product->update(['is_active' => !$product->is_active]);
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
            'field'      => 'required|in:unit_total_price,marketer_fee_per_unit',
            'percentage' => 'required|numeric',
            // Positive = increase, negative = decrease
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
            'message'  => 'Bulk update applied.',
            'products' => $offer->fresh()->products,
        ]);
    }
}
