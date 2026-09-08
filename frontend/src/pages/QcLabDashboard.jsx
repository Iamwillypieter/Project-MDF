import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LaporanCard from '../components/LaporanCard';
import './Dashboard.css';

// Card navigasi Input Laporan — hanya 1 card: Quality Shift Report
const LAPORAN_CARDS = [
  {
    to:    '/qclab/quality-shift-report',
    icon:  '📋',
    title: 'Quality Shift Report',
    desc:  'In-Process Testing: Chips Moisture, Bulk Density, Glue Mix & Hardener',
    color: 'bg-teal-600',
  },
];

const QcLabDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">

        {/* Header */}
        <div className="dashboard-header">
          <h2>Dashboard QC Lab</h2>
          <p>
            Selamat datang, <strong>{user?.name}</strong>.{' '}
            Anda dapat mengelola data hasil pengujian kualitas produk.
          </p>
        </div>

        {/* Card navigasi cross-role (read-only) */}
        <div className="card-grid">
          <Link
            to="/produksi/history-laporan"
            className="card card-gray"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-icon">🏭</div>
            <div className="card-content">
              <h3>Data Produksi</h3>
              <p>Lihat data produksi (read-only)</p>
            </div>
          </Link>

          <Link
            to="/sending/history-laporan"
            className="card card-blue"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>Data Sending</h3>
              <p>Lihat data pengiriman (read-only)</p>
            </div>
          </Link>

          {/* Shortcut ke history QC Lab */}
          <Link
            to="/qclab/history"
            className="card card-green"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>History QC Lab</h3>
              <p>Lihat semua laporan QC Lab</p>
            </div>
          </Link>
        </div>

        {/* Section: Input Laporan */}
        <div className="laporan-section">
          <div className="laporan-section-header">
            <h3 className="laporan-section-title">Input Laporan Baru</h3>
            <p className="laporan-section-sub">Pilih jenis laporan yang ingin diisi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LAPORAN_CARDS.map(card => (
              <LaporanCard key={card.to} {...card} />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default QcLabDashboard;
