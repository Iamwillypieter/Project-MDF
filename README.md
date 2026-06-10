# MDF System

Aplikasi web manufaktur dengan 3 role: Admin, Produksi, dan Sending.

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL

---

## Setup

### 1. Database PostgreSQL
Buat database baru:
```sql
CREATE DATABASE mdf_db;
```

### 2. Backend
Edit file `.env` di folder `backend/`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password   <-- ganti dengan password PostgreSQL kamu
DB_NAME=mdf_db
JWT_SECRET=your_jwt_secret  <-- ganti dengan string acak yang kuat
```

Jalankan backend:
```bash
cd backend
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm run dev
```

---

## Default Login

| Role     | Username  | Password      |
|----------|-----------|---------------|
| Admin    | admin     | admin123      |
| Produksi | produksi  | produksi123   |
| Sending  | sending   | sending123    |

> ⚠️ Ganti password default setelah pertama kali login.

---

## Akses Role

| Halaman            | Admin | Produksi | Sending |
|--------------------|-------|----------|---------|
| /admin/dashboard   | ✅    | ❌       | ❌      |
| /produksi/dashboard| ❌    | ✅       | ❌      |
| /sending/dashboard | ❌    | ❌       | ✅      |
