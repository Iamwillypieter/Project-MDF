@echo off
:: ============================================================================
::  DEPLOY.BAT — Update Aplikasi ke Versi Terbaru
::  Jalankan setiap kali ada kode baru yang sudah di-push ke GitHub.
::
::  Cara pakai:
::    1. Klik kanan file ini → "Run as administrator"
::    2. Tunggu sampai selesai, aplikasi otomatis restart
:: ============================================================================

title Deploy MDF - Update Aplikasi
color 0B
cls

echo.
echo  ============================================================
echo   DEPLOY MDF — Update ke Versi Terbaru
echo   %date% %time%
echo  ============================================================
echo.

:: ── Cek Administrator ────────────────────────────────────────────────────────
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo  [ERROR] Harus dijalankan sebagai Administrator!
    pause
    exit /b 1
)

:: ── Tentukan direktori project ───────────────────────────────────────────────
set PROJECT_DIR=%~dp0..
if "%PROJECT_DIR:~-1%"=="\" set PROJECT_DIR=%PROJECT_DIR:~0,-1%
cd /d "%PROJECT_DIR%"

:: ── Step 1: Pull kode terbaru ─────────────────────────────────────────────────
echo  [1/4] Mengambil kode terbaru dari GitHub...
git pull origin main
if %errorLevel% NEQ 0 (
    echo.
    echo  [ERROR] Gagal git pull!
    echo  Kemungkinan penyebab:
    echo    - Tidak ada koneksi internet
    echo    - Ada konflik file lokal (jalankan: git status)
    echo.
    pause
    exit /b 1
)
echo  [OK] Kode terbaru berhasil diambil.

:: ── Step 2: Install/update dependensi backend ────────────────────────────────
echo.
echo  [2/4] Update dependensi backend...
cd /d "%PROJECT_DIR%\backend"
call npm install
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal npm install backend!
    pause
    exit /b 1
)
echo  [OK] Backend dependencies updated.

:: ── Step 3: Install/update dan build frontend ────────────────────────────────
echo.
echo  [3/4] Update dan build frontend...
cd /d "%PROJECT_DIR%\frontend"
call npm install
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal npm install frontend!
    pause
    exit /b 1
)
call npm run build
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal build frontend!
    pause
    exit /b 1
)
echo  [OK] Frontend berhasil di-build.

:: ── Step 4: Restart aplikasi ─────────────────────────────────────────────────
echo.
echo  [4/4] Restart aplikasi via PM2...
cd /d "%PROJECT_DIR%"
call pm2 restart ecosystem.config.js --update-env
if %errorLevel% NEQ 0 (
    echo  [WARN] pm2 restart gagal, mencoba pm2 start...
    call pm2 start ecosystem.config.js --env production
)
call pm2 save
echo  [OK] Aplikasi berhasil direstart.

:: ── Selesai ──────────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   DEPLOY SELESAI! %date% %time%
echo  ============================================================
echo.
echo  Status aplikasi saat ini:
call pm2 status
echo.
echo  Aplikasi berjalan di: http://localhost:5000
echo.
pause
