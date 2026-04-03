-- Prefer: cd backend && php artisan migrate
--
-- If you cannot run Artisan, execute the statements you need.
-- If you see "Duplicate column", that column already exists — skip it.

-- Products (fixes: Unknown column 'promo_discount_percent')
ALTER TABLE `products` ADD COLUMN `promo_discount_percent` DECIMAL(5,2) NULL;

-- Offers (offer-wide promos)
ALTER TABLE `offers` ADD COLUMN `promo_code` VARCHAR(255) NULL;
ALTER TABLE `offers` ADD COLUMN `promo_expiry` DATE NULL;
ALTER TABLE `offers` ADD COLUMN `promo_discount_percent` DECIMAL(5,2) NULL;

-- Legacy column from older schema (safe to run if column exists; ignore error if already dropped)
-- ALTER TABLE `products` DROP COLUMN `promo_discount`;
