import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>Dashboard Admin</h2>
          <p>Selamat datang, <strong>{user?.name}</strong>. Anda memiliki akses penuh ke seluruh sistem.</p>
        </div>

        <div className="card-grid">

          {/* Card Produksi — navigasi ke history laporan (read-only untuk admin) */}
          <Link
            to="/produksi/history-laporan"
            className="card card-purple"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-icon">🏭</div>
            <div className="card-content">
              <h3>Data Produksi</h3>
              <p>Pantau seluruh aktivitas produksi</p>
            </div>
          </Link>

          {/* Card Sending — navigasi ke history laporan sending */}
          <Link
            to="/sending/history-laporan"
            className="card card-blue"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>Data Sending</h3>
              <p>Pantau seluruh aktivitas pengiriman</p>
            </div>
          </Link>

          {/* Card Manajemen User */}
          <div
            className="card card-green"
            onClick={() => navigate('/admin/users')}
          >
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>Manajemen User</h3>
              <p>Kelola akun dan hak akses user</p>
            </div>
          </div>

        </div>

        <div className="placeholder-section">
          <p>Form dan data akan ditambahkan di sini.</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
