@echo off
:: ============================================================================
::  SETUP.BAT — Instalasi Pertama Kali di Komputer Server
::  Jalankan SEKALI SAJA saat pertama kali pasang aplikasi di server.
::
::  Cara pakai:
::    1. Klik kanan file ini → "Run as administrator"
::    2. Ikuti instruksi yang muncul di layar
:: ============================================================================

title Setup MDF Production Server
color 0A
cls

echo.
echo  ============================================================
echo   SETUP MDF PRODUCTION SERVER
echo  ============================================================
echo.

:: ── Cek apakah dijalankan sebagai Administrator ──────────────────────────────
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo  [ERROR] Script ini harus dijalankan sebagai Administrator!
    echo  Klik kanan file setup.bat lalu pilih "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: ── Cek Node.js ──────────────────────────────────────────────────────────────
echo  [1/7] Memeriksa Node.js...
node --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo  [ERROR] Node.js tidak ditemukan!
    echo.
    echo  Silakan download dan install Node.js v16 terlebih dahulu:
    echo  https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi
    echo.
    echo  Setelah install, jalankan ulang setup.bat ini.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% ditemukan.

:: ── Cek Git ──────────────────────────────────────────────────────────────────
echo  [2/7] Memeriksa Git...
git --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo  [ERROR] Git tidak ditemukan!
    echo.
    echo  Silakan download dan install Git terlebih dahulu:
    echo  https://git-scm.com/download/win
    echo.
    echo  Setelah install, jalankan ulang setup.bat ini.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
echo  [OK] %GIT_VER% ditemukan.

:: ── Install PM2 ──────────────────────────────────────────────────────────────
echo  [3/7] Menginstall PM2 dan pm2-windows-startup...
call npm install -g pm2 pm2-windows-startup
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal install PM2. Cek koneksi internet dan coba lagi.
    pause
    exit /b 1
)
echo  [OK] PM2 berhasil diinstall.

:: ── Tentukan direktori project ───────────────────────────────────────────────
echo.
echo  [4/7] Menentukan lokasi folder project...
set PROJECT_DIR=%~dp0..
:: Hapus trailing backslash jika ada
if "%PROJECT_DIR:~-1%"=="\" set PROJECT_DIR=%PROJECT_DIR:~0,-1%
echo  [OK] Folder project: %PROJECT_DIR%

:: ── Buat folder logs ─────────────────────────────────────────────────────────
echo  [5/7] Membuat folder logs...
if not exist "%PROJECT_DIR%\logs" (
    mkdir "%PROJECT_DIR%\logs"
    echo  [OK] Folder logs dibuat.
) else (
    echo  [OK] Folder logs sudah ada.
)

:: ── Buat file .env jika belum ada ────────────────────────────────────────────
echo  [6/7] Menyiapkan file konfigurasi .env...
if not exist "%PROJECT_DIR%\backend\.env" (
    copy "%PROJECT_DIR%\backend\.env.example" "%PROJECT_DIR%\backend\.env" >nul
    echo.
    echo  ============================================================
    echo   PENTING: File backend\.env telah dibuat dari template.
    echo   Kamu HARUS mengisi nilainya sebelum lanjut!
    echo  ============================================================
    echo.
    echo  Buka file: %PROJECT_DIR%\backend\.env
    echo  Isi nilai berikut:
    echo    - DATABASE_URL  : URL koneksi PostgreSQL kamu
    echo    - JWT_SECRET    : String acak panjang (minimal 64 karakter)
    echo    - ALLOWED_ORIGINS: IP server ini, contoh: http://192.168.3.77:5000
    echo.
    echo  Tekan tombol apapun untuk membuka file .env di Notepad...
    pause >nul
    notepad "%PROJECT_DIR%\backend\.env"
    echo.
    echo  Setelah selesai mengisi .env, tekan tombol apapun untuk lanjut...
    pause >nul
) else (
    echo  [OK] File .env sudah ada, dilewati.
)

:: ── Install dependensi & build ───────────────────────────────────────────────
echo  [7/7] Install dependensi dan build frontend...
echo.

echo  --- Install backend dependencies ---
cd /d "%PROJECT_DIR%\backend"
call npm install
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal install dependensi backend!
    pause
    exit /b 1
)
echo  [OK] Backend dependencies terinstall.

echo.
echo  --- Install frontend dependencies ---
cd /d "%PROJECT_DIR%\frontend"
call npm install
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal install dependensi frontend!
    pause
    exit /b 1
)
echo  [OK] Frontend dependencies terinstall.

echo.
echo  --- Build frontend (Vite) ---
call npm run build
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal build frontend!
    pause
    exit /b 1
)
echo  [OK] Frontend berhasil di-build.

:: ── Jalankan aplikasi dengan PM2 ─────────────────────────────────────────────
echo.
echo  --- Menjalankan aplikasi dengan PM2 ---
cd /d "%PROJECT_DIR%"
call pm2 start ecosystem.config.js --env production
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal menjalankan PM2!
    pause
    exit /b 1
)

:: Simpan daftar proses PM2
call pm2 save

:: Register PM2 agar otomatis jalan saat Windows startup
call pm2-startup install

:: ── Cek IP server ────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   SETUP SELESAI!
echo  ============================================================
echo.
echo  Status aplikasi:
call pm2 status
echo.
echo  IP komputer ini (berikan ke user pabrik):
ipconfig | findstr /i "IPv4"
echo.
echo  User pabrik bisa akses aplikasi di browser dengan alamat:
echo    http://[IP-DIATAS]:5000
echo.
echo  Contoh: http://192.168.3.77:5000
echo.
echo  ============================================================
echo.
pause
