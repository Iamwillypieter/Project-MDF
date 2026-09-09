/**
 * PM2 Ecosystem Configuration
 * Dokumentasi: https://pm2.keymetrics.io/docs/usage/application-declaration/
 *
 * Cara pakai:
 *   pm2 start ecosystem.config.js          (pertama kali)
 *   pm2 reload ecosystem.config.js --update-env   (deploy / zero-downtime reload)
 *   pm2 save                               (simpan process list agar auto-start setelah reboot)
 *   pm2 startup                            (generate startup script OS)
 */

module.exports = {
  apps: [
    {
      // ── Identitas Aplikasi ─────────────────────────────────────────────────
      name: 'mdf-backend',
      script: 'src/index.js',
      cwd: './backend',

      // ── Mode: cluster untuk memanfaatkan semua CPU core ───────────────────
      // Ganti ke 'fork' jika server hanya punya 1 vCPU
      exec_mode: 'cluster',
      instances: 'max',   // atau angka eksplisit, misal: 2

      // ── Environment Variables ──────────────────────────────────────────────
      // env         → dipakai saat: pm2 start / pm2 restart
      // env_production → dipakai saat: pm2 start --env production
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ── Auto-restart & Crash Protection ───────────────────────────────────
      watch: false,                  // jangan watch di production (CPU boros)
      autorestart: true,
      max_restarts: 10,              // maksimal restart berturut-turut sebelum PM2 berhenti mencoba
      min_uptime: '5s',              // proses dianggap stabil jika hidup minimal 5 detik
      restart_delay: 3000,           // tunggu 3 detik sebelum restart (ms)
      exp_backoff_restart_delay: 100, // backoff eksponensial antar restart (ms)
      max_memory_restart: '512M',    // restart otomatis jika RAM melebihi 512 MB

      // ── Logging ───────────────────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,              // gabungkan log semua instance cluster

      // ── Zero-Downtime Reload ───────────────────────────────────────────────
      // Graceful shutdown: tunggu request selesai sebelum mematikan instance lama
      kill_timeout: 5000,            // paksa kill setelah 5 detik jika proses tidak mau berhenti
      listen_timeout: 8000,          // waktu tunggu instance baru siap (ms)
      wait_ready: true,              // tunggu event process.send('ready') dari app
    },
  ],
};
