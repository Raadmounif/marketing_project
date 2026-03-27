<?php
/**
 * One-time: run Composer to create vendor/. DELETE this file after success.
 * Token must match BOOTSTRAP_TOKEN in deploy/.env (written by deploy-full.mjs as .bootstrap-token).
 */
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');
set_time_limit(600);

$root = dirname(__DIR__);
$tokenFile = $root . '/.bootstrap-token';
$expected = is_file($tokenFile) ? trim((string) file_get_contents($tokenFile)) : '';
$given = (string) ($_GET['token'] ?? '');

if ($expected === '' || !hash_equals($expected, $given)) {
    http_response_code(403);
    exit("Forbidden.\n");
}

chdir($root);
putenv('HOME=' . $root);
putenv('COMPOSER_HOME=' . $root . '/.composer');
@mkdir($root . '/.composer', 0755, true);

/**
 * Remove old vendor tree to avoid partial/corrupt installs.
 */
function rrmdir(string $dir): void {
    if (!is_dir($dir)) return;
    $items = scandir($dir);
    if ($items === false) return;
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $p = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($p) && !is_link($p)) {
            rrmdir($p);
        } else {
            @unlink($p);
        }
    }
    @rmdir($dir);
}

$vendor = $root . '/vendor';
if (is_dir($vendor)) {
    echo "Deleting old vendor/ ...\n";
    rrmdir($vendor);
}

$composerPhar = $root . '/composer.phar';
if (!is_file($composerPhar)) {
    http_response_code(500);
    exit("Missing composer.phar in api root.\n");
}

passthru('php ' . escapeshellarg($composerPhar) . ' install --no-dev --optimize-autoloader --no-scripts 2>&1', $code);
echo "\nExit code: $code\n";
if ($code === 0) {
    echo "\nOK — delete install-vendor.php, composer.phar, and .bootstrap-token from the server.\n";
}
