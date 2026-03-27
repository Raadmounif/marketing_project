# Tobacco Market — cPanel Deployment Guide

Production domain for this project: **https://puffplaza.com** (API at **https://puffplaza.com/api**).

## Prerequisites
- cPanel hosting with PHP 8.2+ and MySQL 8+
- Node.js 18+ on your local machine for building the frontend
- Composer available on your local machine or cPanel (via Terminal)

---

## Step 1 — Database Setup (cPanel)

1. Go to cPanel → **MySQL Databases**
2. Create a new database: `tobacco_market` (cPanel may prefix it, e.g. `pufflbci_tobacco_market`)
3. Create a new MySQL user with a strong password
4. Add the user to the database with **All Privileges**
5. Note down: DB name, DB user, DB password, DB host (usually `127.0.0.1`)

---

## Step 2 — Backend (Laravel) Deployment

### 2a. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in (match **puffplaza.com**):

```
APP_URL=https://puffplaza.com/api
FRONTEND_URL=https://puffplaza.com

DB_HOST=127.0.0.1
DB_DATABASE=your_cpanel_prefix_tobacco_market
DB_USERNAME=your_cpanel_prefix_dbuser
DB_PASSWORD=your_strong_password

SANCTUM_STATEFUL_DOMAINS=puffplaza.com,www.puffplaza.com,localhost

MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM_ADDRESS=your_gmail@gmail.com
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail"

### 2b. Install Dependencies & Prepare

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan storage:link
```

### 2c. Upload to cPanel

**Option A — Subfolder (matches `puffplaza.com` + `deploy/cpanel-public_html.htaccess`)**

1. Upload the entire `backend/` folder contents to `public_html/api/` (so `public/` is `public_html/api/public/`).
2. The site root `.htaccess` (uploaded by `npm run deploy` in `deploy/`) routes `/api/*` to `api/public/index.php`.

**Option B — Subdomain**

1. In cPanel → **Subdomains**, create `api.puffplaza.com`
2. Set its document root to `public_html/api/public`
3. Upload the entire `backend/` folder contents to `public_html/api/`
4. Set `APP_URL=https://api.puffplaza.com`, `VITE_API_URL=https://api.puffplaza.com/api`, and use a root `.htaccess` that only does SPA routing (no Laravel rules in root).

### 2d. Run Migrations & Seeders (via cPanel Terminal or SSH)

```bash
cd ~/public_html/api
php artisan migrate --force
php artisan db:seed --force
```

> **Default accounts created by seeder:**
> - Admin: `admin@tobaccomarket.com` / `Admin@123`
> - Staff: `staff@tobaccomarket.com` / `Staff@123`
> **Change these immediately after first login!**

### 2e. Set Up Cron Job (cPanel)

In cPanel → **Cron Jobs**, add (replace `your_cpanel_user`):

```
* * * * * php /home/your_cpanel_user/public_html/api/artisan schedule:run >> /dev/null 2>&1
```

---

## Step 3 — Frontend (React) Deployment

### 3a. Configure API URL

```bash
cd frontend
cp .env.example .env
```

For **puffplaza.com** (subfolder API):

```
VITE_API_URL=https://puffplaza.com/api
```

### 3b. Build

```bash
npm install
npm run build
```

This creates a `frontend/dist/` folder.

### 3c. Upload from this repo (`deploy/`)

**Frontend only:**

```bash
cd deploy
cp .env.example .env
# Edit .env: SFTP_* credentials, DEPLOY_CONFIRM=YES_DEPLOY, VITE_API_URL=https://puffplaza.com/api
npm install
npm run deploy
```

**Full stack (frontend + Laravel upload + SSH `composer` / `artisan`):**

Requires **SSH access** on the same host (often the same port as SFTP, e.g. `21098`). In `deploy/.env` set `FULL_DEPLOY_CONFIRM=YES_FULL_DEPLOY`, `DEPLOY_CONFIRM=YES_DEPLOY`, `SSH_PORT`, SFTP credentials, and **MySQL** `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` from cPanel → MySQL Databases (so migrations can run).

```bash
cd deploy
npm install
npm run deploy:full
```

This builds the frontend, uploads `dist/` and root `.htaccess`, uploads the Laravel tree (without `vendor`), writes `api/.env` from `backend/.env.example` plus your DB/mail overrides, then runs `composer install`, `php artisan key:generate`, `storage:link`, `migrate`, `db:seed`, and fixes permissions.

If SSH or `composer` on the server fails, use **cPanel → Terminal** and run the printed commands manually.

### Hosts without SSH (SFTP only)

`npm run deploy:full` uploads `composer.phar`, a secret token file (`.bootstrap-token`), and two one-time PHP scripts under `api/public/`. After deploy, open the printed URLs in order:

1. **install-vendor.php** — runs `composer install` to create `vendor/`.
2. **run-artisan.php** — runs `key:generate`, `storage:link`, `migrate`, `db:seed`.

Then **delete** from the server: `api/composer.phar`, `api/.bootstrap-token`, `api/public/install-vendor.php`, `api/public/run-artisan.php`.

Ensure **MySQL** credentials are already in the uploaded `api/.env` (set `DB_*` in `deploy/.env` before deploying). If `exec`/`passthru` are disabled in PHP, enable SSH in cPanel or use **cPanel → Terminal**.

**If Composer left `vendor/` in a bad state** (e.g. first run ran `package:discover` before Laravel was ready): delete **`public_html/api/vendor`** in **cPanel → File Manager** (faster than SFTP for huge trees), then open **install-vendor.php** again. The script uses `composer install --no-dev --optimize-autoloader --no-scripts` so post-install Artisan hooks do not run until **run-artisan.php**.

### 3d. Manual upload (alternative)

1. Upload **all contents** of `frontend/dist/` to `public_html/`
2. Copy `deploy/cpanel-public_html.htaccess` to `public_html/.htaccess` (API + SPA routing)

---

## Step 4 — File Permissions

SSH into your server and run:

```bash
chmod -R 755 ~/public_html/api
chmod -R 775 ~/public_html/api/storage
chmod -R 775 ~/public_html/api/bootstrap/cache
```

---

## Step 5 — Verify

1. Visit `https://puffplaza.com` — landing page should load
2. Visit `https://puffplaza.com/api/offers` — should return `[]` (JSON)
3. Register a customer account and place a test order
4. Check your notification email for the order email

---

## Folder Structure on cPanel Server

```
~/public_html/
├── index.html          ← React app entry
├── assets/             ← React build assets
├── .htaccess           ← from deploy/cpanel-public_html.htaccess (API + SPA)
└── api/                ← Laravel backend
    ├── public/         ← Laravel public (routed via root .htaccess)
    │   ├── index.php
    │   ├── .htaccess
    │   └── storage/    ← symlink to storage/app/public
    ├── app/
    ├── database/
    ├── storage/
    └── ...
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| 500 error on API | Check `storage/logs/laravel.log`, ensure storage is writable |
| CORS error | Verify `FRONTEND_URL` in `.env` matches `https://puffplaza.com` |
| Images not loading | Run `php artisan storage:link` |
| Emails not sending | Verify Gmail App Password (not your regular Gmail password) |
| SPA routes show 404 | Ensure root `.htaccess` is uploaded and mod_rewrite is enabled |
| API 404 | Confirm Laravel lives at `~/public_html/api` and `backend/public/.htaccess` uses `RewriteBase /api/public/` |
