/**
 * ProtectedRoute – Guard route berdasarkan auth state & role
 *
 * - Saat loading (cek session awal): tampilkan spinner fullpage, BUKAN null/white screen
 * - Saat isLoggingOut: tampilkan overlay "Sedang keluar..."
 * - Tidak login: redirect ke /login
 * - Login tapi role tidak sesuai: redirect ke /unauthorized
 * - Login & role sesuai: render children + aktifkan useAutoLogout
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './ui/LoadingState';
import useAutoLogout from '../hooks/useAutoLogout';

// Inner component — hanya dirender saat user sudah login
// Pisahkan agar useAutoLogout tidak dipanggil saat user null
const AuthorizedContent = ({ children }) => {
  useAutoLogout();
  return children;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isLoggingOut } = useAuth();

  // ── 1. Masih mengecek session (initial load / refresh) ──────────────────
  if (loading) {
    return <LoadingState fullPage message="Memuat sesi..." />;
  }

  // ── 2. Sedang proses logout ──────────────────────────────────────────────
  if (isLoggingOut) {
    return <LoadingState fullPage message="Sedang keluar..." />;
  }

  // ── 3. Belum login ───────────────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ── 4. Role tidak diizinkan ──────────────────────────────────────────────
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── 5. Authorized — render dengan auto-logout aktif ─────────────────────
  return <AuthorizedContent>{children}</AuthorizedContent>;
};

export default ProtectedRoute;
