<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OfferController extends Controller
{
    public function index(): JsonResponse
    {
        // Return all products (including inactive) so the frontend can show "out of stock"
        $offers = Offer::where('is_active', true)
            ->with([
                'sections' => fn ($q) => $q->orderBy('sort_order'),
                'sections.products' => fn ($q) => $q->orderBy('created_at', 'desc'),
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($offers as $offer) {
            $flat = $offer->sections->sortBy('sort_order')->flatMap->products->values();
            $offer->setRelation('products', $flat);
        }

        return response()->json($offers);
    }

    public function show(Offer $offer): JsonResponse
    {
        $offer->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.products' => fn ($q) => $q->orderBy('created_at', 'desc'),
        ]);
        $flat = $offer->sections->sortBy('sort_order')->flatMap->products->values();
        $offer->setRelation('products', $flat);

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
            'marketer_fee_schedule'                   => 'nullable|array',
            'marketer_fee_schedule.qty_fees'          => 'nullable|array',
            'marketer_fee_schedule.qty_fees.1'        => 'nullable|numeric|min:0',
            'marketer_fee_schedule.qty_fees.2'        => 'nullable|numeric|min:0',
            'marketer_fee_schedule.qty_fees.3'        => 'nullable|numeric|min:0',
            'marketer_fee_schedule.qty_fees.4'        => 'nullable|numeric|min:0',
            'marketer_fee_schedule.state_extras'      => 'nullable|array',
            'is_active'      => 'boolean',
        ]);

        $offer = Offer::create($data);

        $offer->sections()->create([
            'name_ar' => 'عام',
            'name_en' => 'General',
            'sort_order' => 0,
            'marketer_fee_per_unit' => null,
        ]);

        return response()->json($offer->fresh()->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.products',
        ]), 201);
    }

    public function update(Request $request, Offer $offer): JsonResponse
    {
        $data = $request->validate([
            'name_ar'        => 'sometimes|string|max:255',
            'name_en'        => 'sometimes|string|max:255',
            'code'           => "sometimes|string|unique:offers,code,{$offer->id}|max:50",
            'delivery_costs' => 'sometimes|array',
            'marketer_fee_schedule'              => 'nullable|array',
            'marketer_fee_schedule.qty_fees'     => 'nullable|array',
            'marketer_fee_schedule.state_extras' => 'nullable|array',
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
