<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// For cPanel deployment, set this to dirname(__DIR__) . '/app'
// For local development, use dirname(__DIR__)
$laravelRoot = dirname(__DIR__);

if (file_exists($maintenance = $laravelRoot . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelRoot . '/vendor/autoload.php';

(require_once $laravelRoot . '/bootstrap/app.php')
    ->handleRequest(Request::capture());
