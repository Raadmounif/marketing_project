<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\OfferSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferSectionController extends Controller
{
    public function index(Offer $offer): JsonResponse
    {
        $sections = $offer->sections()->orderBy('sort_order')->get();

        return response()->json($sections);
    }

    public function store(Request $request, Offer $offer): JsonResponse
    {
        $data = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'marketer_fee_per_unit' => 'nullable|numeric|min:0',
        ]);

        $section = $offer->sections()->create($data);

        return response()->json($section, 201);
    }

    public function update(Request $request, Offer $offer, OfferSection $section): JsonResponse
    {
        $this->assertSectionBelongsToOffer($offer, $section);

        $data = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'sometimes|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'marketer_fee_per_unit' => 'nullable|numeric|min:0',
        ]);

        $section->update($data);

        return response()->json($section->fresh());
    }

    public function destroy(Offer $offer, OfferSection $section): JsonResponse
    {
        $this->assertSectionBelongsToOffer($offer, $section);

        if ($offer->sections()->count() <= 1) {
            return response()->json([
                'message' => 'An offer must keep at least one section.',
            ], 422);
        }

        if ($section->products()->exists()) {
            return response()->json([
                'message' => 'Remove or move products from this section before deleting it.',
            ], 422);
        }

        $section->delete();

        return response()->json(['message' => 'Section deleted.']);
    }

    private function assertSectionBelongsToOffer(Offer $offer, OfferSection $section): void
    {
        if ((int) $section->offer_id !== (int) $offer->id) {
            abort(404);
        }
    }
}
