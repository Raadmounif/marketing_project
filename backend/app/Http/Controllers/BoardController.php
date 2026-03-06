<?php

namespace App\Http\Controllers;

use App\Models\AdvertisingBoard;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class BoardController extends Controller
{
    public function index(): JsonResponse
    {
        $boards = AdvertisingBoard::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json($boards);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content_ar'  => 'required|string',
            'content_en'  => 'required|string',
            'image'       => 'nullable|image|max:3072',
            'is_active'   => 'boolean',
            'sort_order'  => 'integer',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('boards', 'public');
        }

        $board = AdvertisingBoard::create([
            ...$data,
            'image_path' => $imagePath,
        ]);

        return response()->json($board, 201);
    }

    public function update(Request $request, AdvertisingBoard $board): JsonResponse
    {
        $data = $request->validate([
            'content_ar' => 'sometimes|string',
            'content_en' => 'sometimes|string',
            'image'      => 'nullable|image|max:3072',
            'is_active'  => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        if ($request->hasFile('image')) {
            if ($board->image_path) {
                Storage::disk('public')->delete($board->image_path);
            }
            $data['image_path'] = $request->file('image')->store('boards', 'public');
        }

        $board->update($data);

        return response()->json($board->fresh());
    }

    public function destroy(AdvertisingBoard $board): JsonResponse
    {
        if ($board->image_path) {
            Storage::disk('public')->delete($board->image_path);
        }
        $board->delete();
        return response()->json(['message' => 'Board item deleted.']);
    }
}
