@echo off
:: ============================================================================
::  DEPLOY.BAT — Update Aplikasi ke Versi Terbaru
::  Jalankan setiap kali ada kode baru yang sudah di-push ke GitHub.
::
::  Cara pakai:
::    Klik dua kali file ini atau jalankan di Command Prompt
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

:: ── Tentukan direktori project ───────────────────────────────────────────────
set PROJECT_DIR=%~dp0..
if "%PROJECT_DIR:~-1%"=="\" set PROJECT_DIR=%PROJECT_DIR:~0,-1%
cd /d "%PROJECT_DIR%"

:: ── Step 1: Pull kode terbaru ─────────────────────────────────────────────────
echo  [1/4] Mengambil kode terbaru dari GitHub...
git pull origin master
if %errorLevel% NEQ 0 (
    echo  [ERROR] Gagal git pull!
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

:: ── Step 3: Build frontend ───────────────────────────────────────────────────
echo.
echo  [3/4] Build frontend...
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

:: Commit hasil build ke GitHub agar selalu up-to-date
cd /d "%PROJECT_DIR%"
git add -f frontend/dist/
git commit -m "build: update frontend dist [auto]" 2>nul
git push origin master 2>nul

:: ── Step 4: Restart aplikasi ─────────────────────────────────────────────────
echo.
echo  [4/4] Restart aplikasi via PM2...
cd /d "%PROJECT_DIR%"
call pm2 restart mdf-backend --update-env
call pm2 save
echo  [OK] Aplikasi berhasil direstart.

:: ── Selesai ──────────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   DEPLOY SELESAI! %date% %time%
echo  ============================================================
echo.
echo  Aplikasi berjalan di: http://192.168.3.77:5000
echo.
call pm2 status
echo.
pause
