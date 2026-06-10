import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const SendingDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>Dashboard Sending</h2>
          <p>Selamat datang, <strong>{user?.name}</strong>. Anda dapat mengelola data pengiriman.</p>
        </div>

        <div className="card-grid">

          {/* Card Data Produksi — navigasi ke history laporan (read-only untuk sending) */}
          <Link
            to="/produksi/history-laporan"
            className="card card-gray"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-icon">🏭</div>
            <div className="card-content">
              <h3>Data Produksi</h3>
              <p>Lihat data produksi (read only)</p>
            </div>
          </Link>

          {/* Card Data Sending — placeholder */}
          <div className="card card-green">
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>Data Sending</h3>
              <p>Input dan kelola data pengiriman</p>
            </div>
          </div>

        </div>

        <div className="placeholder-section">
          <p>Form sending akan ditambahkan di sini.</p>
        </div>
      </main>
    </div>
  );
};

export default SendingDashboard;
