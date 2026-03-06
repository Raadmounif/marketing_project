<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OfferController extends Controller
{
    public function index(): JsonResponse
    {
        $offers = Offer::where('is_active', true)
            ->with(['activeProducts'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($offers);
    }

    public function show(Offer $offer): JsonResponse
    {
        $offer->load('products');
        return response()->json($offer);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_ar'        => 'required|string|max:255',
            'name_en'        => 'required|string|max:255',
            'code'           => 'required|string|unique:offers,code|max:50',
            'delivery_costs' => 'required|array',
            'delivery_costs.Abu Dhabi'       => 'required|numeric|min:0',
            'delivery_costs.Dubai'           => 'required|numeric|min:0',
            'delivery_costs.Sharjah'         => 'required|numeric|min:0',
            'delivery_costs.Ajman'           => 'required|numeric|min:0',
            'delivery_costs.Umm Al Quwain'   => 'required|numeric|min:0',
            'delivery_costs.Ras Al Khaimah'  => 'required|numeric|min:0',
            'delivery_costs.Fujairah'        => 'required|numeric|min:0',
            'delivery_costs.other'           => 'required|numeric|min:0',
            'is_active'      => 'boolean',
        ]);

        $offer = Offer::create($data);

        return response()->json($offer, 201);
    }

    public function update(Request $request, Offer $offer): JsonResponse
    {
        $data = $request->validate([
            'name_ar'        => 'sometimes|string|max:255',
            'name_en'        => 'sometimes|string|max:255',
            'code'           => "sometimes|string|unique:offers,code,{$offer->id}|max:50",
            'delivery_costs' => 'sometimes|array',
            'is_active'      => 'sometimes|boolean',
        ]);

        $offer->update($data);

        return response()->json($offer->fresh());
    }

    public function destroy(Offer $offer): JsonResponse
    {
        $offer->delete();
        return response()->json(['message' => 'Offer deleted.']);
    }
}
