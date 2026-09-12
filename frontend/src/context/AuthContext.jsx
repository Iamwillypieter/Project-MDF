/**
 * AuthContext – Persistent Session, Token Validation, Auto-Logout Support
 *
 * Flow:
 * 1. Saat mount, baca token dari localStorage
 * 2. Validasi token ke backend (/api/auth/me)
 * 3. Kalau valid → set user, kalau tidak → clear session
 * 4. Expose: user, token, loading, login, logout, logoutWithReason
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = `http://${window.location.hostname}:5000/api`;

// Key untuk localStorage
const TOKEN_KEY   = 'mdf_token';
const USER_KEY    = 'mdf_user';
const EXPIRY_KEY  = 'mdf_expiry';

// Masa berlaku session: 8 jam (sesuai JWT_EXPIRES_IN)
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user,           setUser]           = useState(null);
  const [token,          setToken]          = useState(null);
  const [loading,        setLoading]        = useState(true);   // true selama cek session awal
  const [isLoggingOut,   setIsLoggingOut]   = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');     // pesan auto-logout
  const didInit = useRef(false);

  // ── Helper: simpan session ke localStorage ──────────────────────────────────
  const persistSession = (tok, usr) => {
    const expiry = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem(TOKEN_KEY,  tok);
    localStorage.setItem(USER_KEY,   JSON.stringify(usr));
    localStorage.setItem(EXPIRY_KEY, String(expiry));
  };

  // ── Helper: hapus session dari localStorage ─────────────────────────────────
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async (message = '') => {
    setIsLoggingOut(true);
    if (message) setSessionMessage(message);
    // Beri waktu sebentar agar UI bisa tampilkan feedback
    await new Promise((res) => setTimeout(res, 400));
    clearSession();
    setToken(null);
    setUser(null);
    setIsLoggingOut(false);
  }, []);

  // ── Logout dengan pesan (untuk auto-logout) ─────────────────────────────────
  const logoutWithReason = useCallback((reason) => {
    logout(reason);
  }, [logout]);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { token: tok, user: usr } = response.data;
    persistSession(tok, usr);
    setToken(tok);
    setUser(usr);
    setSessionMessage('');
    return usr;
  };

  // ── Validasi session saat mount (sekali saja) ────────────────────────────────
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const initAuth = async () => {
      const storedToken  = localStorage.getItem(TOKEN_KEY);
      const storedUser   = localStorage.getItem(USER_KEY);
      const storedExpiry = localStorage.getItem(EXPIRY_KEY);

      // Tidak ada token — langsung selesai loading
      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      // Cek apakah session sudah expired di sisi client
      if (storedExpiry && Date.now() > Number(storedExpiry)) {
        clearSession();
        setLoading(false);
        return;
      }

      // ── Optimistic Auth ──────────────────────────────────────────────────
      // Set user dari localStorage DULU agar tidak ada white screen saat refresh.
      // Loading selesai di sini, user langsung masuk dashboard.
      try {
        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
      } catch (e) {
        clearSession();
        setLoading(false);
        return;
      }
      setLoading(false);

      // Validasi token ke backend di background (silent).
      // Kalau token ternyata expired/invalid → logout tanpa ganggu UX.
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
          timeout: 8000,
        });
        // Token masih valid → refresh data user & expiry
        setUser(res.data.user);
        persistSession(storedToken, res.data.user);
      } catch (err) {
        // Hanya logout kalau server tegas menolak token (401/403)
        // Kalau network error / timeout → biarkan user tetap login
        const status = err.response && err.response.status;
        if (status === 401 || status === 403) {
          clearSession();
          setToken(null);
          setUser(null);
        }
        // Network error / timeout: user tetap bisa pakai app
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isLoggingOut,
      sessionMessage,
      setSessionMessage,
      login,
      logout,
      logoutWithReason,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
