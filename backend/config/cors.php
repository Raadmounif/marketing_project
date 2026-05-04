<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'https://puffplaza.com'),
        'https://www.puffplaza.com',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        // Vite default when using --host 127.0.0.1 (must match browser URL)
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000',
    ],
    // Any local dev port (Vite often uses 5173/5174/5175 when one is taken)
    'allowed_origins_patterns' => [
        '#^http://(localhost|127\.0\.0\.1):\d+$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
