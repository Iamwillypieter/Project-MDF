/**
 * useAutoLogout – Auto-logout setelah idle 60 menit
 *
 * Cara pakai:
 *   import useAutoLogout from '../hooks/useAutoLogout';
 *   // Di dalam komponen yang hanya dirender saat user login:
 *   useAutoLogout();
 *
 * - Mendeteksi aktivitas: mousemove, mousedown, keydown, scroll, touchstart, click
 * - Reset timer setiap kali ada aktivitas
 * - Setelah 60 menit idle: logout + tampilkan pesan notifikasi
 * - Cleanup otomatis saat komponen unmount (no memory leak)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 menit

// Event yang dianggap sebagai "aktivitas user"
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

const useAutoLogout = (timeoutMs = IDLE_TIMEOUT_MS) => {
  const { user, logoutWithReason } = useAuth();
  const navigate    = useNavigate();
  const timerRef    = useRef(null);
  const isActiveRef = useRef(true); // cegah double-logout

  // ── Fungsi reset timer ────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!isActiveRef.current) return;
      isActiveRef.current = false;

      await logoutWithReason('Sesi Anda telah berakhir karena tidak ada aktivitas selama 1 jam.');
      navigate('/login', { replace: true });
    }, timeoutMs);
  }, [timeoutMs, logoutWithReason, navigate]);

  useEffect(() => {
    // Hanya aktif kalau user sudah login
    if (!user) return;

    isActiveRef.current = true;

    // Pasang event listener
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Mulai timer pertama kali
    resetTimer();

    // Cleanup saat unmount atau user berubah
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, resetTimer]);
};

export default useAutoLogout;
