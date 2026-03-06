# Tobacco Market — cPanel Deployment Guide

## Prerequisites
- cPanel hosting with PHP 8.2+ and MySQL 8+
- Node.js 18+ on your local machine for building the frontend
- Composer available on your local machine or cPanel (via Terminal)

---

## Step 1 — Database Setup (cPanel)

1. Go to cPanel → **MySQL Databases**
2. Create a new database: `tobacco_market`
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

Edit `.env` and fill in:
```
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

DB_HOST=127.0.0.1
DB_DATABASE=your_cpanel_prefix_tobacco_market
DB_USERNAME=your_cpanel_prefix_dbuser
DB_PASSWORD=your_strong_password

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

**Option A — Subdomain (Recommended)**
1. In cPanel → **Subdomains**, create `api.yourdomain.com`
2. Set its document root to `public_html/api/public`
3. Upload the entire `backend/` folder contents to `public_html/api/`

**Option B — Subfolder**
1. Upload `backend/` to `public_html/api/`
2. Access it at `yourdomain.com/api/`

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

In cPanel → **Cron Jobs**, add:
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

Edit `.env`:
```
VITE_API_URL=https://api.yourdomain.com/api
```

### 3b. Build

```bash
npm install
npm run build
```

This creates a `frontend/dist/` folder.

### 3c. Upload to cPanel

1. Upload **all contents** of `frontend/dist/` to `public_html/` (the root of your domain)
2. The `.htaccess` file in `public/` is already configured for SPA routing — make sure it's uploaded

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

1. Visit `https://yourdomain.com` — landing page should load
2. Visit `https://api.yourdomain.com/api/offers` — should return `[]` (JSON)
3. Register a customer account and place a test order
4. Check `raadmunif2@gmail.com` for the order email

---

## Folder Structure on cPanel Server

```
~/public_html/
├── index.html          ← React app entry
├── assets/             ← React build assets
├── .htaccess           ← SPA routing
└── api/                ← Laravel backend
    ├── public/         ← Laravel's public folder (subdomain points here)
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
| CORS error | Verify `FRONTEND_URL` in `.env` matches your actual domain |
| Images not loading | Run `php artisan storage:link` |
| Emails not sending | Verify Gmail App Password (not your regular Gmail password) |
| SPA routes show 404 | Ensure `.htaccess` is uploaded and mod_rewrite is enabled |
