# Database Migrations — MDF System

Folder ini berisi skema SQL lengkap untuk semua tabel di PostgreSQL (Neon).

## Koneksi Database
Database di-host di **Neon.com** — connection string ada di `backend/.env`.

---

## Daftar File

| File | Tabel | Keterangan |
|------|-------|------------|
| `001_users.sql` | `users` | Akun pengguna (admin, produksi, sending) |
| `002_laporan_produksi_mdf.sql` | `laporan_produksi_mdf` | Form Laporan Produksi MDF dengan kalkulasi M3 |
| `003_laporan_chipper_mdf.sql` | `laporan_chipper_mdf` | Form Laporan Chipper MDF |
| `004_laporan_cooling_staking.sql` | `laporan_cooling_staking` | Form Laporan Cooling Staking |
| `005_laporan_imal.sql` | `laporan_imal` | Form Pemakaian Bahan Baku / Shift (IMAL) |

---

## Cara Menjalankan Ulang Skema

Jika perlu membuat ulang tabel di database baru, jalankan file SQL
secara berurutan (001 → 005) melalui Neon SQL Editor atau psql:

```sql
-- Jalankan satu per satu di Neon SQL Editor
\i 001_users.sql
\i 002_laporan_produksi_mdf.sql
\i 003_laporan_chipper_mdf.sql
\i 004_laporan_cooling_staking.sql
\i 005_laporan_imal.sql
```

Atau cukup jalankan `npm run dev` di folder `backend/` —
`initDb.js` akan otomatis membuat semua tabel jika belum ada
(`CREATE TABLE IF NOT EXISTS`).

---

## Aturan Penambahan Fitur Baru

Setiap kali membuat form/fitur baru yang butuh tabel baru:
1. Buat file SQL baru dengan nomor urut berikutnya (misal `006_nama_tabel.sql`)
2. Tambahkan `CREATE TABLE IF NOT EXISTS` di `backend/src/config/initDb.js`
3. Commit kedua file sekaligus agar skema selalu sinkron
