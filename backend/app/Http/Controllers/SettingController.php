<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class SettingController extends Controller
{
    /** Setting keys stored in DB → public JSON keys under `social` */
    private const SOCIAL_SETTING_TO_SLUG = [
        'social_facebook_url'  => 'facebook',
        'social_instagram_url' => 'instagram',
        'social_x_url'        => 'x',
        'social_tiktok_url'   => 'tiktok',
        'social_youtube_url'  => 'youtube',
        'social_snapchat_url' => 'snapchat',
        'social_whatsapp_url' => 'whatsapp',
    ];

    private const SOCIAL_URL_KEYS = [
        'social_facebook_url',
        'social_instagram_url',
        'social_x_url',
        'social_tiktok_url',
        'social_youtube_url',
        'social_snapchat_url',
        'social_whatsapp_url',
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Public header links (social + contact). No auth — only values the admin configured.
     */
    public function publicHeader(): JsonResponse
    {
        $social = [];
        foreach (self::SOCIAL_SETTING_TO_SLUG as $settingKey => $slug) {
            $url = trim((string) Setting::get($settingKey, ''));
            if ($url !== '' && self::isSafeHttpUrl($url)) {
                $social[$slug] = $url;
            }
        }

        $contact = trim((string) Setting::get('contact_url', ''));
        $contactOut = ($contact !== '' && self::isSafeContactUrl($contact)) ? $contact : null;

        return response()->json([
            'contact_url' => $contactOut,
            'social'      => $social,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $input = $request->all();
        foreach (array_merge(['contact_url'], self::SOCIAL_URL_KEYS) as $key) {
            if (! array_key_exists($key, $input)) {
                continue;
            }
            $v = $input[$key];
            if (is_string($v) && trim($v) === '') {
                $input[$key] = null;
            }
        }
        $request->replace($input);

        $rules = [
            'notification_email' => 'required|email',
            'contact_url'        => 'nullable|string|max:2048',
        ];
        foreach (self::SOCIAL_URL_KEYS as $key) {
            $rules[$key] = 'nullable|string|max:2048';
        }

        $data = $request->validate($rules);

        if (! empty($data['contact_url']) && ! self::isSafeContactUrl($data['contact_url'])) {
            throw ValidationException::withMessages([
                'contact_url' => 'The contact link must use http(s), mailto:, or tel:.',
            ]);
        }
        foreach (self::SOCIAL_URL_KEYS as $key) {
            if (! empty($data[$key]) && ! self::isSafeHttpUrl($data[$key])) {
                throw ValidationException::withMessages([
                    $key => 'Social links must start with http:// or https://.',
                ]);
            }
        }

        foreach ($data as $key => $value) {
            Setting::set($key, $value ?? '');
        }

        return response()->json(['message' => 'Settings updated.']);
    }

    private static function isSafeHttpUrl(string $url): bool
    {
        $t = strtolower(trim($url));
        return str_starts_with($t, 'https://') || str_starts_with($t, 'http://');
    }

    private static function isSafeContactUrl(string $url): bool
    {
        $t = strtolower(trim($url));
        return str_starts_with($t, 'https://')
            || str_starts_with($t, 'http://')
            || str_starts_with($t, 'mailto:')
            || str_starts_with($t, 'tel:');
    }
}
