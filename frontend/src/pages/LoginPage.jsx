import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // set true sebelum hit API

    try {
      const user = await login(username, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'produksi') navigate('/produksi/dashboard');
      else if (user.role === 'sending') navigate('/sending/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Coba lagi.';
      const detail = err.response?.data?.detail ? ` (${err.response.data.detail})` : '';
      setError(msg + detail);
    } finally {
      setIsLoading(false); // wajib di finally — berhenti baik sukses maupun error
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>MDF System</h1>
          <p>Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert-error">{error}</div>}

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-spinner-wrapper">
                <Spinner size="sm" className="text-white" />
                Memproses...
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
