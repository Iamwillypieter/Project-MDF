/**
 * PM2 Ecosystem Configuration – Windows Compatible
 * Dokumentasi: https://pm2.keymetrics.io/docs/usage/application-declaration/
 *
 * Cara pakai di server:
 *   pm2 start ecosystem.config.js --env production   (pertama kali)
 *   pm2 restart ecosystem.config.js --update-env     (setelah update kode)
 *   pm2 save                                         (simpan agar auto-start setelah reboot)
 *   pm2-startup install                              (register auto-start Windows)
 */

module.exports = {
  apps: [
    {
      // ── Identitas Aplikasi ─────────────────────────────────────────────────
      name: 'mdf-backend',
      script: 'src/index.js',
      cwd: './backend',

      // ── Mode: fork (wajib untuk Windows — cluster tidak stabil di Win 7/10) ─
      exec_mode: 'fork',
      instances: 1,

      // ── Environment Variables ──────────────────────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ── Auto-restart & Crash Protection ───────────────────────────────────
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      max_memory_restart: '400M',

      // ── Logging ───────────────────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,

      // ── Graceful Shutdown ─────────────────────────────────────────────────
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: true,
    },
  ],
};
