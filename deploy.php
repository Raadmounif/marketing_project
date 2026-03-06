<?php
// One-time deployment script — DELETES ITSELF after running
set_time_limit(600);
ini_set('display_errors', 1);
error_reporting(E_ALL);

$laravel = '/home/myworld1/laravel_app';
chdir($laravel);

function run($label, $cmd) {
    echo "<div style='margin:8px 0;padding:10px;background:#1e1e1e;border-left:4px solid #4caf50;'>";
    echo "<strong style='color:#4caf50'>» $label</strong><br>";
    echo "<pre style='color:#ddd;margin:4px 0;font-size:13px'>" . htmlspecialchars(shell_exec($cmd . ' 2>&1')) . "</pre>";
    echo "</div>";
    flush(); ob_flush();
}

echo "<!DOCTYPE html><html><head><title>Deploying...</title></head>";
echo "<body style='background:#121212;color:#fff;font-family:monospace;padding:30px;max-width:900px'>";
echo "<h2 style='color:#4caf50'>Tobacco Market — Auto Deploy</h2>";
echo "<p style='color:#aaa'>Running setup on server...</p>";

run("Composer Install", "composer install --no-dev --optimize-autoloader");
run("Generate App Key", "php artisan key:generate --force");
run("Run Migrations", "php artisan migrate --force");
run("Seed Database", "php artisan db:seed --force");

// Set permissions
shell_exec("chmod -R 775 /home/myworld1/laravel_app/storage /home/myworld1/laravel_app/bootstrap/cache 2>&1");
echo "<div style='color:#4caf50'>✓ Permissions set</div>";

// Create storage symlink at public_html/api/storage
$link = '/home/myworld1/public_html/api/storage';
$target = '/home/myworld1/laravel_app/storage/app/public';
if (!file_exists($link) && !is_link($link)) {
    symlink($target, $link);
    echo "<div style='color:#4caf50'>✓ Storage symlink created</div>";
} else {
    echo "<div style='color:#aaa'>ℹ Storage symlink already exists</div>";
}

echo "<div style='background:#4caf50;color:#000;padding:20px;margin-top:25px;border-radius:4px;font-size:16px'>";
echo "<strong>✅ Deployment Complete!</strong><br><br>";
echo "Your site: <a href='http://myworld.sy743.example.com/' style='color:#000;font-weight:bold'>http://myworld.sy743.example.com/</a><br>";
echo "Admin login: admin@tobaccomarket.com / Admin@123<br>";
echo "Staff login: staff@tobaccomarket.com / Staff@123";
echo "</div>";
echo "<p style='color:#ff7043;margin-top:15px'>⚠ This file has been deleted for security.</p>";
echo "</body></html>";

unlink(__FILE__);
