<?php

namespace App\Http\Controllers;

use App\Models\HowItWorks;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HowItWorksController extends Controller
{
    public function index(): JsonResponse
    {
        $items = HowItWorks::orderBy('sort_order')->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title_ar'   => 'required|string|max:255',
            'title_en'   => 'required|string|max:255',
            'body_ar'    => 'required|string',
            'body_en'    => 'required|string',
            'sort_order' => 'integer',
        ]);

        $item = HowItWorks::create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, HowItWorks $item): JsonResponse
    {
        $data = $request->validate([
            'title_ar'   => 'sometimes|string|max:255',
            'title_en'   => 'sometimes|string|max:255',
            'body_ar'    => 'sometimes|string',
            'body_en'    => 'sometimes|string',
            'sort_order' => 'sometimes|integer',
        ]);

        $item->update($data);
        return response()->json($item->fresh());
    }

    public function destroy(HowItWorks $item): JsonResponse
    {
        $item->delete();
        return response()->json(['message' => 'Item deleted.']);
    }
}
