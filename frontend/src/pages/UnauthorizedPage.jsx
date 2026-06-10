import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (user?.role === 'admin') navigate('/admin/dashboard');
    else if (user?.role === 'produksi') navigate('/produksi/dashboard');
    else if (user?.role === 'sending') navigate('/sending/dashboard');
    else navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      gap: '16px',
    }}>
      <div style={{ fontSize: '4rem' }}>🚫</div>
      <h1 style={{ color: '#1e293b', margin: 0 }}>Akses Ditolak</h1>
      <p style={{ color: '#64748b', margin: 0 }}>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      <button
        onClick={handleBack}
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          background: '#1e293b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
};

export default UnauthorizedPage;
