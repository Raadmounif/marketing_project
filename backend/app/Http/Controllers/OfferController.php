<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OfferController extends Controller
{
    /**
     * Public: active offers only (landing, customers).
     */
    public function index(): JsonResponse
    {
        return response()->json($this->loadOffersForResponse(
            Offer::where('is_active', true)
        ));
    }

    /**
     * Staff/admin: all offers including disabled (manage screens).
     */
    public function indexAll(): JsonResponse
    {
        return response()->json($this->loadOffersForResponse(Offer::query()));
    }

    /**
     * Public offer detail — hidden when offer is disabled.
     */
    public function show(Offer $offer): JsonResponse
    {
        if (! $offer->is_active) {
            abort(404);
        }

        return response()->json($this->hydrateOffer($offer));
    }

    /**
     * Staff/admin: offer detail even when disabled.
     */
    public function showStaff(Offer $offer): JsonResponse
    {
        return response()->json($this->hydrateOffer($offer));
    }

    private function loadOffersForResponse($query): \Illuminate\Support\Collection
    {
        $offers = $query
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

        return $offers;
    }

    private function hydrateOffer(Offer $offer): Offer
    {
        $offer->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.products' => fn ($q) => $q->orderBy('created_at', 'desc'),
        ]);
        $flat = $offer->sections->sortBy('sort_order')->flatMap->products->values();
        $offer->setRelation('products', $flat);

        return $offer;
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
            'promo_code'                 => 'nullable|string|max:50',
            'promo_expiry'               => 'nullable|date',
            'promo_discount_percent'     => 'nullable|numeric|min:0|max:100',
        ]);

        if (! array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        $this->normalizeOfferPromoFields($data);
        $promoErr = $this->validateOfferPromoConsistency($data);
        if ($promoErr !== null) {
            return response()->json(['message' => $promoErr], 422);
        }

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
            'promo_code'                 => 'nullable|string|max:50',
            'promo_expiry'               => 'nullable|date',
            'promo_discount_percent'     => 'nullable|numeric|min:0|max:100',
        ]);

        $this->normalizeOfferPromoFields($data);
        $promoErr = $this->validateOfferPromoConsistency($data);
        if ($promoErr !== null) {
            return response()->json(['message' => $promoErr], 422);
        }

        $offer->update($data);

        return response()->json($offer->fresh());
    }

    public function destroy(Offer $offer): JsonResponse
    {
        $offer->delete();
        return response()->json(['message' => 'Offer deleted.']);
    }

    private function normalizeOfferPromoFields(array &$data): void
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

    private function validateOfferPromoConsistency(array $data): ?string
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
