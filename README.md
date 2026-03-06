# Tobacco Market — Full-Stack Web App

A bilingual (Arabic / English) B2B tobacco marketplace built with **Laravel 11** (REST API) and **React 18 + TypeScript** (SPA frontend).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11, PHP 8.2+, Laravel Sanctum |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Database | MySQL 8+ |
| Auth | Token-based (Sanctum Bearer tokens) |
| Email | SMTP (Gmail) |

---

## Features

- **3 roles:** Admin, Staff, Customer
- Product offers & catalog with photos, promo codes, delivery costs per UAE emirate
- Order placement, receipt upload, customer feedback
- Admin/Staff user management (create, delete, reset passwords)
- Advertising board & "How It Works" content management
- Order statistics & overdue order notifications
- Fully bilingual UI (Arabic RTL / English)

---

## Prerequisites

Make sure you have these installed:

- **PHP 8.2+** (with extensions: `zip`, `pdo_mysql`, `mbstring`, `openssl`)
- **Composer**
- **Node.js 18+** and **npm**
- **MySQL 8+**

> On Windows, [XAMPP](https://www.apachefriends.org/) provides PHP, MySQL, and Apache in one package.

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Raadmounif/marketing_project.git
cd marketing_project
```

---

### 2. Backend (Laravel)

```bash
cd backend
```

**Install PHP dependencies:**
```bash
composer install
```

**Create the environment file:**
```bash
cp .env.example .env
```

**Edit `.env`** and set your database and mail credentials:
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_DATABASE=tobacco_market
DB_USERNAME=root
DB_PASSWORD=

MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your@gmail.com

SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,localhost
```

**Generate the app key:**
```bash
php artisan key:generate
```

**Create the database** (MySQL):
```sql
CREATE DATABASE tobacco_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Run migrations and seed initial data:**
```bash
php artisan migrate --seed
```

**Create the storage symlink:**
```bash
php artisan storage:link
```

**Start the backend server:**
```bash
php artisan serve
```

Backend runs at → `http://localhost:8000`

---

### 3. Frontend (React)

Open a new terminal:

```bash
cd frontend
```

**Install dependencies:**
```bash
npm install
```

**Create the environment file:**
```bash
cp .env.example .env
```

**Edit `.env`:**
```env
VITE_API_URL=http://localhost:8000/api
```

**Start the dev server:**
```bash
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## Default Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@tobaccomarket.com | Admin@123 |
| Staff | staff@tobaccomarket.com | Staff@123 |

> Customers register themselves at `/register`.

---

## Project Structure

```
marketing_project/
├── backend/                  # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/ # API controllers
│   │   ├── Models/           # Eloquent models
│   │   └── Mail/             # Email notifications
│   ├── database/
│   │   ├── migrations/       # DB schema
│   │   └── seeders/          # Default data
│   └── routes/api.php        # All API routes
│
└── frontend/                 # React 18 + TypeScript
    └── src/
        ├── pages/            # All page components
        │   ├── admin/        # Admin-only pages
        │   └── staff/        # Staff pages
        ├── components/       # Reusable components
        ├── contexts/         # Auth & Language context
        ├── api/              # Axios API client
        ├── i18n/             # Arabic & English translations
        └── types/            # TypeScript types
```

---

## API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/login` | Public |
| POST | `/api/register` | Public |
| GET | `/api/offers` | Public |
| GET | `/api/my-orders` | Customer |
| POST | `/api/orders` | Customer |
| PATCH | `/api/orders/{id}/feedback` | Customer |
| GET | `/api/orders` | Staff + Admin |
| DELETE | `/api/orders/{id}` | Admin |
| GET | `/api/users` | Staff + Admin |
| POST | `/api/users` | Staff + Admin |
| DELETE | `/api/users/{id}` | Staff + Admin |
| GET | `/api/settings` | Admin |

---

## Build for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output is in frontend/dist/
```

**Backend:** Upload the `backend/` folder to your server, run `composer install --no-dev`, then configure your web server to point to `backend/public/`.

---

## License

MIT
