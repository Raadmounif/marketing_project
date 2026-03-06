<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = $request->user()
            ->favorites()
            ->with('product.offer')
            ->get();

        return response()->json($favorites);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $favorite = Favorite::firstOrCreate([
            'user_id'    => $request->user()->id,
            'product_id' => $data['product_id'],
        ]);

        return response()->json($favorite->load('product'), 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()
            ->favorites()
            ->where('product_id', $product->id)
            ->delete();

        return response()->json(['message' => 'Removed from favorites.']);
    }
}
