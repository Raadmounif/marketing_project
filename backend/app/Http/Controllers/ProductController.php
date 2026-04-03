<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\OfferSection;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Throwable;

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

    /**
     * Bulk-import products from CSV. Header: Arabic Name, English Name, Price (per unit).
     * Optional section rows: first cell "Section {name}" and another cell "Marketer Fee per Unit {n}"
     * create/switch target section until the next section row.
     */
    public function importCsv(Request $request, Offer $offer): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $ext = strtolower($request->file('file')->getClientOriginalExtension());
        if (! in_array($ext, ['csv', 'txt'], true)) {
            return response()->json(['message' => 'File must be a .csv or .txt file.'], 422);
        }

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return response()->json(['message' => 'Could not read file.'], 422);
        }

        $firstBytes = fread($handle, 3);
        if ($firstBytes !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $headerRow = fgetcsv($handle);
        if ($headerRow === false || $this->csvRowIsEmpty($headerRow)) {
            fclose($handle);

            return response()->json(['message' => 'CSV header row is missing or empty.'], 422);
        }

        if (isset($headerRow[0])) {
            $headerRow[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headerRow[0]);
        }

        $colMap = $this->resolveProductCsvColumnMap($headerRow);
        if ($colMap === null) {
            fclose($handle);

            return response()->json([
                'message' => 'Could not parse CSV headers. Expected: Arabic Name, English Name, Price (per unit)',
            ], 422);
        }

        $currentSection = $offer->sections()
            ->where(function ($q) {
                $q->where('name_en', 'General')->orWhere('name_ar', 'عام');
            })
            ->orderBy('sort_order')
            ->first();

        if (! $currentSection) {
            $currentSection = $offer->sections()->orderBy('sort_order')->first();
        }

        if (! $currentSection) {
            fclose($handle);

            return response()->json([
                'message' => 'No section found for this offer. Add a section first.',
            ], 422);
        }

        $imported = 0;
        $sectionDirectives = 0;
        $sectionsCreated = 0;
        $errors = [];
        $lineNum = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNum++;
            if ($this->csvRowIsEmpty($row)) {
                continue;
            }

            $directive = $this->parseCsvSectionDirectiveRow($row);
            if ($directive !== null) {
                if ($directive['error'] !== null) {
                    $errors[] = ['line' => $lineNum, 'message' => $directive['error']];

                    continue;
                }

                $beforeId = $offer->sections()
                    ->where(function ($q) use ($directive) {
                        $q->where('name_en', $directive['name'])->orWhere('name_ar', $directive['name']);
                    })
                    ->value('id');
                $currentSection = $this->findOrCreateSectionForCsvImport($offer, $directive['name'], $directive['fee']);
                $sectionDirectives++;
                if ($beforeId === null) {
                    $sectionsCreated++;
                }

                continue;
            }

            $nameAr = trim((string) ($row[$colMap['name_ar']] ?? ''));
            $nameEn = trim((string) ($row[$colMap['name_en']] ?? ''));
            $priceRaw = trim((string) ($row[$colMap['price']] ?? ''));

            if ($nameAr === '' || $nameEn === '' || $priceRaw === '') {
                $errors[] = ['line' => $lineNum, 'message' => 'Missing Arabic name, English name, or price.'];

                continue;
            }

            if (! is_numeric($priceRaw)) {
                $errors[] = ['line' => $lineNum, 'message' => 'Invalid price.'];

                continue;
            }

            $price = (float) $priceRaw;
            if ($price < 0) {
                $errors[] = ['line' => $lineNum, 'message' => 'Price must be >= 0.'];

                continue;
            }

            $fee = (float) ($currentSection->marketer_fee_per_unit ?? 0);

            try {
                $currentSection->products()->create([
                    'offer_id' => $offer->id,
                    'name_ar' => mb_substr($nameAr, 0, 255),
                    'name_en' => mb_substr($nameEn, 0, 255),
                    'unit_total_price' => round($price, 2),
                    'marketer_fee_per_unit' => $fee,
                    'photos' => null,
                    'is_active' => true,
                ]);
                $imported++;
            } catch (Throwable $e) {
                $errors[] = ['line' => $lineNum, 'message' => 'Save failed: '.$e->getMessage()];
            }
        }

        fclose($handle);

        $offer->update(['csv_imported_at' => now()]);
        $offer->refresh();

        return response()->json([
            'imported' => $imported,
            'section_directives' => $sectionDirectives,
            'sections_created' => $sectionsCreated,
            'errors' => $errors,
            'last_section_id' => $currentSection->id,
            'csv_imported_at' => $offer->csv_imported_at?->toIso8601String(),
            'message' => $imported > 0
                ? "Imported {$imported} product(s)."
                : (! empty($errors) ? 'No rows imported.' : 'No data rows found.'),
        ]);
    }

    /**
     * @return array{name: string, fee: float, error: null}|array{name: '', fee: 0.0, error: string}
     */
    private function parseCsvSectionDirectiveRow(array $row): ?array
    {
        $c0 = trim((string) ($row[0] ?? ''));
        if ($c0 === '') {
            return null;
        }

        $name = null;

        if (preg_match('/^section\s+(.+)$/iu', $c0, $m)) {
            $name = trim($m[1]);
        } elseif (strcasecmp($c0, 'section') === 0 && isset($row[1]) && trim((string) $row[1]) !== '') {
            $name = trim((string) $row[1]);
        }

        if ($name === null || $name === '') {
            return null;
        }

        $joined = implode(' ', array_map(static fn ($c) => trim((string) $c), $row));
        $feeStr = null;

        foreach ($row as $i => $cell) {
            $cell = (string) $cell;
            if (preg_match('/marketer\s+fee\s+per\s+unit\s*:?\s*([\d.]+)/iu', $cell, $fm)) {
                $feeStr = $fm[1];
                break;
            }
        }

        if ($feeStr === null && preg_match('/marketer\s+fee\s+per\s+unit\s*:?\s*([\d.]+)/iu', $joined, $fm)) {
            $feeStr = $fm[1];
        }

        if ($feeStr === null && preg_match('/\b([\d.]+)\s*$/u', $joined, $fm)) {
            $feeStr = $fm[1];
        }

        if ($feeStr === null || ! is_numeric($feeStr)) {
            return [
                'name' => '',
                'fee' => 0.0,
                'error' => 'Section row must include a marketer fee number (e.g. Marketer Fee per Unit 7).',
            ];
        }

        $fee = (float) $feeStr;
        if ($fee < 0) {
            return [
                'name' => '',
                'fee' => 0.0,
                'error' => 'Marketer fee must be >= 0.',
            ];
        }

        return [
            'name' => mb_substr($name, 0, 255),
            'fee' => $fee,
            'error' => null,
        ];
    }

    private function findOrCreateSectionForCsvImport(Offer $offer, string $name, float $fee): OfferSection
    {
        $section = $offer->sections()
            ->where(function ($q) use ($name) {
                $q->where('name_en', $name)->orWhere('name_ar', $name);
            })
            ->first();

        if ($section === null) {
            $maxOrder = (int) $offer->sections()->max('sort_order');

            $section = $offer->sections()->create([
                'name_ar' => $name,
                'name_en' => $name,
                'sort_order' => $maxOrder + 1,
                'marketer_fee_per_unit' => $fee,
            ]);
        } else {
            $section->update(['marketer_fee_per_unit' => $fee]);
            $section->refresh();
        }

        return $section;
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

    private function csvRowIsEmpty(array $row): bool
    {
        foreach ($row as $cell) {
            if ($cell !== null && trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{name_ar: int, name_en: int, price: int}|null
     */
    private function resolveProductCsvColumnMap(array $headerRow): ?array
    {
        $norm = [];
        foreach ($headerRow as $i => $h) {
            $norm[$i] = strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $h)));
            $norm[$i] = preg_replace('/\s+/u', ' ', $norm[$i]);
        }

        $map = [];
        foreach ($norm as $i => $h) {
            if ($h === 'arabic name' || str_ends_with($h, 'arabic name')) {
                $map['name_ar'] = $i;
            } elseif ($h === 'english name' || str_ends_with($h, 'english name')) {
                $map['name_en'] = $i;
            } elseif ($h === 'price (per unit)' || $h === 'price' || (str_contains($h, 'price') && str_contains($h, 'unit'))) {
                $map['price'] = $i;
            }
        }

        if (isset($map['name_ar'], $map['name_en'], $map['price'])) {
            return $map;
        }

        $nonEmpty = [];
        foreach ($headerRow as $i => $h) {
            if ($h !== null && trim((string) $h) !== '') {
                $nonEmpty[] = $i;
            }
        }

        if (count($nonEmpty) >= 3) {
            return [
                'name_ar' => $nonEmpty[0],
                'name_en' => $nonEmpty[1],
                'price' => $nonEmpty[2],
            ];
        }

        return null;
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
