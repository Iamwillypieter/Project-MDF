import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LaporanCard from '../components/LaporanCard';
import './Dashboard.css';

// Card laporan sanding — sending & sanding adalah role yang sama
const LAPORAN_CARDS = [
  {
    to:    '/sending/laporan-hasil-sanding',
    icon:  '📊',
    title: 'Laporan Hasil Sanding / Grading MDF',
    desc:  'Input dan kelola laporan hasil sanding & grading MDF',
    color: 'bg-purple-600',
  },
  {
    to:    '/sending/laporan-kertas-pasir',
    icon:  '📋',
    title: 'Laporan Pemakaian Kertas Pasir',
    desc:  'Monitoring penggunaan grit/grade kertas pasir',
    color: 'bg-orange-500',
  },
  {
    to:    '/sending/daily-test-report',
    icon:  '🔬',
    title: 'Daily Test Report — Sanding Line',
    desc:  'Pengujian harian Board Density, Physical Test, MC & Swelling',
    color: 'bg-indigo-600',
  },
];

const SendingDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">

        {/* Header */}
        <div className="dashboard-header">
          <h2>Dashboard Sending</h2>
          <p>Selamat datang, <strong>{user?.name}</strong>. Anda dapat mengelola data pengiriman.</p>
        </div>

        {/* Card navigasi utama */}
        <div className="card-grid">

          <Link to="/produksi/history-laporan" className="card card-gray" style={{ textDecoration: 'none' }}>
            <div className="card-icon">🏭</div>
            <div className="card-content">
              <h3>Data Produksi</h3>
              <p>Lihat data produksi (read only)</p>
            </div>
          </Link>

          <Link to="/sending/history-laporan" className="card card-teal" style={{ textDecoration: 'none' }}>
            <div className="card-icon">📂</div>
            <div className="card-content">
              <h3>History Laporan</h3>
              <p>Riwayat laporan sanding & kertas pasir</p>
            </div>
          </Link>

        </div>

        {/* Section: Input Laporan */}
        <div className="laporan-section">
          <div className="laporan-section-header">
            <h3 className="laporan-section-title">Input Laporan</h3>
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

export default SendingDashboard;
