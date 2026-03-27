<?php
/**
 * One-time: key, storage:link, migrate, seed. DELETE after success.
 */
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');
set_time_limit(600);
error_reporting(E_ALL);
ini_set('display_errors', '1');

$root = dirname(__DIR__);
$php = PHP_BINARY && is_executable(PHP_BINARY) ? PHP_BINARY : 'php';
$tokenFile = $root . '/.bootstrap-token';
$expected = is_file($tokenFile) ? trim((string) file_get_contents($tokenFile)) : '';
$given = (string) ($_GET['token'] ?? '');

if ($expected === '' || !hash_equals($expected, $given)) {
    http_response_code(403);
    exit("Forbidden.\n");
}

chdir($root);

$cacheDir = $root . '/bootstrap/cache';
if (is_dir($cacheDir)) {
    foreach (glob($cacheDir . '/*.php') ?: [] as $f) {
        @unlink($f);
    }
}

$steps = [
    $php . ' artisan package:discover --ansi',
    $php . ' artisan key:generate --force',
    $php . ' artisan storage:link',
    $php . ' artisan migrate:fresh --seed --force',
];

foreach ($steps as $cmd) {
    echo ">>> $cmd\n";
    passthru($cmd . ' 2>&1', $code);
    echo "\nExit: $code\n\n";
}

echo "Done — delete run-artisan.php, install-vendor.php, composer.phar, and .bootstrap-token.\n";
