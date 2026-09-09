# Panduan Deployment – MDF Production

Dokumen ini mencakup:
1. Persiapan server
2. Konfigurasi GitHub Secrets
3. Cara kerja CI/CD (GitHub Actions)
4. Manajemen proses dengan PM2
5. Checklist keamanan production

---

## 1. Prasyarat Server

| Kebutuhan | Versi Minimum | Cara Install |
|---|---|---|
| Node.js | 20 LTS | `nvm install 20` |
| npm | 10+ | Ikut Node.js |
| PM2 | terbaru | `npm install -g pm2` |
| Git | 2.x | `apt install git` |

### Setup awal di server (sekali saja)

```bash
# 1. Clone repository
git clone https://github.com/<USERNAME>/<REPO>.git /var/www/mdf
cd /var/www/mdf

# 2. Buat file .env backend
cp backend/.env.example backend/.env
nano backend/.env        # Isi semua nilai yang diperlukan

# 3. Buat folder logs untuk PM2
mkdir -p logs

# 4. Install dependensi
cd backend  && npm install --production=false && cd ..
cd frontend && npm install --production=false && npm run build && cd ..

# 5. Start aplikasi pertama kali
pm2 start ecosystem.config.js --env production

# 6. Simpan daftar proses PM2 agar auto-start setelah reboot
pm2 save

# 7. Generate startup script (jalankan perintah yang dihasilkan)
pm2 startup
```

---

## 2. GitHub Repository Secrets

Buka: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Tambahkan secret berikut **satu per satu**:

| Secret Name | Contoh Nilai | Keterangan |
|---|---|---|
| `SSH_HOST` | `192.168.3.77` | IP atau hostname server production |
| `SSH_USERNAME` | `ubuntu` | User Linux yang dipakai untuk SSH |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Isi **seluruh** konten file private key (biasanya `~/.ssh/id_rsa`) |
| `SSH_PORT` | `22` | Port SSH server (default 22) |
| `APP_DIR` | `/var/www/mdf` | Path absolut direktori project di server |

### Cara mendapatkan SSH Private Key

```bash
# Di mesin lokal / mesin yang sudah punya akses ke server:
cat ~/.ssh/id_rsa
# Salin seluruh output (termasuk baris -----BEGIN dan -----END) ke secret SSH_PRIVATE_KEY
```

### Tambahkan public key ke server (jika belum)

```bash
# Di mesin lokal:
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.3.77

# Atau manual:
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys  # (dijalankan di server)
```

> **Penting:** Pastikan user SSH punya akses `read/write` ke `APP_DIR` dan bisa menjalankan `git`, `npm`, dan `pm2`.

---

## 3. Alur CI/CD (GitHub Actions)

File: `.github/workflows/deploy.yml`

```
Push ke branch main/master
        │
        ▼
GitHub Actions Runner (ubuntu-latest)
        │
        ▼
SSH masuk ke server production
        │
        ├─ git pull origin main
        ├─ cd backend  → npm install
        ├─ cd frontend → npm install → npm run build
        └─ pm2 reload ecosystem.config.js --update-env
                │
                └─ Zero-downtime: instance baru naik dulu,
                   baru instance lama dimatikan
```

### Memantau hasil deploy

```bash
# Di server – cek status PM2
pm2 status

# Lihat log real-time
pm2 logs mdf-backend

# Lihat log error saja
pm2 logs mdf-backend --err

# Cek log file langsung
tail -f /var/www/mdf/logs/pm2-error.log
```

---

## 4. Manajemen PM2

```bash
# Pertama kali start
pm2 start ecosystem.config.js --env production

# Zero-downtime reload (dipakai oleh CI/CD)
pm2 reload ecosystem.config.js --update-env

# Restart paksa (semua instance mati dulu, lalu start ulang)
pm2 restart mdf-backend

# Stop
pm2 stop mdf-backend

# Hapus dari daftar PM2
pm2 delete mdf-backend

# Monitor real-time (CPU, RAM, Logs)
pm2 monit
```

### Struktur log PM2

```
/var/www/mdf/
└── logs/
    ├── pm2-out.log      # stdout semua instance
    └── pm2-error.log    # stderr semua instance
```

### Rotasi log otomatis

```bash
# Install modul rotasi log PM2
pm2 install pm2-logrotate

# Konfigurasi (opsional)
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 5. Konfigurasi .env Backend (Production)

File: `backend/.env` (dibuat manual di server, **tidak** di-commit ke Git)

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/mdf_db?sslmode=require

JWT_SECRET=<string acak minimal 64 karakter>
JWT_EXPIRES_IN=8h

# IP atau domain yang boleh mengakses API (pisahkan koma)
ALLOWED_ORIGINS=http://192.168.3.77,https://mdf.pabrik.com
```

**Generate JWT_SECRET yang kuat:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 6. Checklist Keamanan Production

### ✅ Sudah dikonfigurasi otomatis

- [x] **Helmet** – security headers (X-Content-Type, X-Frame-Options, CSP, HSTS, dll.)
- [x] **X-Powered-By** dinonaktifkan (via Helmet)
- [x] **CORS whitelist** – hanya origin dari `ALLOWED_ORIGINS` yang diizinkan
- [x] **Rate Limiter Login** – maks 20 percobaan/15 menit per IP
- [x] **Rate Limiter Submit** – maks 30 submit/menit per IP untuk semua endpoint laporan
- [x] **Rate Limiter Global** – maks 300 request/15 menit per IP untuk semua `/api`
- [x] **Sanitasi Input** – express-validator pada endpoint login (trim, escape, validasi format)
- [x] **Parameterized Query** – semua query DB pakai `$1, $2, ...` (lihat contoh di bawah)
- [x] **Static SPA Serving** – frontend/dist di-serve oleh Express, fallback ke index.html
- [x] **PM2 Graceful Reload** – `process.send('ready')` + SIGINT handler
- [x] **.env tidak di-commit** – tercantum di `.gitignore`

### ⚠️ Perlu dikonfigurasi manual di server

- [ ] **HTTPS/TLS** – pasang sertifikat SSL (Let's Encrypt via Certbot, atau Nginx sebagai reverse proxy)
- [ ] **Firewall** – blokir semua port kecuali 22 (SSH), 80, 443 (atau port custom aplikasi)
- [ ] **Nginx reverse proxy** (opsional tapi direkomendasikan) – lihat contoh di bawah
- [ ] **Database backup otomatis** – cron job `pg_dump`
- [ ] **Fail2Ban** – proteksi SSH dari brute-force
- [ ] **Log monitoring** – pantau `pm2-error.log` secara berkala

### Contoh konfigurasi Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name 192.168.3.77;   # Ganti dengan IP atau domain

    # Redirect HTTP → HTTPS (aktifkan jika sudah ada SSL)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Pola Query Aman (Parameterized – Anti SQL Injection)

Semua query di project ini sudah menggunakan pola aman. **Jangan pernah** interpolasi string langsung:

```js
// ❌ BERBAHAYA – rentan SQL Injection
const result = await pool.query(`SELECT * FROM users WHERE username = '${username}'`);

// ✅ AMAN – parameterized query
const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
```

---

## 8. Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Deploy gagal di GitHub Actions | SSH Key salah / user tidak punya akses pm2 | Cek `SSH_PRIVATE_KEY` secret & permission user |
| PM2 tidak `ready` | `process.send('ready')` tidak dipanggil | Pastikan server berhasil `listen()` sebelum `process.send` |
| CORS error di browser | Origin tidak ada di `ALLOWED_ORIGINS` | Tambahkan origin ke `ALLOWED_ORIGINS` di `.env` server |
| 404 saat refresh halaman React | Static serving belum aktif | Pastikan `NODE_ENV=production` di `.env` server |
| Rate limit terkena saat testing | Limit terlalu ketat | Naikkan sementara nilai `max` di `index.js`, atau whitelist IP |
| PM2 tidak auto-start setelah reboot | `pm2 save` & `pm2 startup` belum dijalankan | Jalankan kedua perintah tersebut di server |
