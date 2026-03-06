<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Auto-detect: cPanel has Laravel in public_html/app/, local has it one level up
$laravelRoot = is_dir(dirname(__DIR__) . '/app/vendor')
    ? dirname(__DIR__) . '/app'
    : dirname(__DIR__);

if (file_exists($maintenance = $laravelRoot . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelRoot . '/vendor/autoload.php';

(require_once $laravelRoot . '/bootstrap/app.php')
    ->handleRequest(Request::capture());
