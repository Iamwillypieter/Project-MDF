/**
 * LoginPage – Login dengan loading state, cegah double submit,
 * redirect otomatis jika sudah login, dan tampilkan pesan auto-logout.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import LoadingState from '../components/ui/LoadingState';
import './LoginPage.css';

const dashboardPath = {
  admin:    '/admin/dashboard',
  produksi: '/produksi/dashboard',
  sending:  '/sending/dashboard',
  qc_lab:   '/qclab/dashboard',
};

const LoginPage = () => {
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, loading, sessionMessage, setSessionMessage } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Redirect otomatis kalau sudah login ─────────────────────────────────
  useEffect(() => {
    if (!loading && user) {
      const dest = dashboardPath[user.role] || '/';
      navigate(dest, { replace: true });
    }
  }, [loading, user, navigate]);

  // ── Tampilkan pesan auto-logout dari state (lalu bersihkan) ─────────────
  useEffect(() => {
    if (location.state?.sessionExpired || sessionMessage) {
      // pesan sudah di sessionMessage dari AuthContext
      // bersihkan location.state agar tidak muncul lagi setelah refresh
      window.history.replaceState({}, '');
    }
  }, [location.state, sessionMessage]);

  // ── Saat masih cek session awal, tampilkan loading ──────────────────────
  if (loading) {
    return <LoadingState fullPage message="Memuat sesi..." />;
  }

  // ── Submit login ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // cegah double submit
    setError('');
    setSessionMessage('');
    setIsSubmitting(true);

    try {
      const usr = await login(username, password);
      navigate(dashboardPath[usr.role] || '/', { replace: true });
    } catch (err) {
      const msg    = err.response?.data?.message || 'Login gagal. Coba lagi.';
      const detail = err.response?.data?.detail  ? ` (${err.response.data.detail})` : '';
      setError(msg + detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>MDF System</h1>
          <p>Silakan login untuk melanjutkan</p>
        </div>

        {/* Notifikasi auto-logout */}
        {sessionMessage && (
          <div className="alert-warning" role="alert">
            <span>⚠️ {sessionMessage}</span>
            <button
              className="alert-close"
              onClick={() => setSessionMessage('')}
              aria-label="Tutup notifikasi"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && (
            <div className="alert-error" role="alert">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              autoFocus
              autoComplete="username"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={isSubmitting || !username.trim() || !password.trim()}
          >
            {isSubmitting ? (
              <span className="btn-spinner-wrapper">
                <Spinner size="sm" className="text-white" />
                Masuk...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
