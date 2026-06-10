import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LaporanCard from '../components/LaporanCard';
import './Dashboard.css';

// Konfigurasi 4 card laporan — mudah ditambah tanpa ubah struktur JSX
const LAPORAN_CARDS = [
  {
    to:    '/produksi/laporan-mdf',
    icon:  '📋',
    title: 'Laporan MDF',
    desc:  'Input dan lihat laporan produksi MDF',
    color: 'bg-orange-600',
  },
  {
    to:    '/produksi/laporan-chipper',
    icon:  '🪚',
    title: 'Laporan Chipper',
    desc:  'Input dan lihat laporan Chipper MDF',
    color: 'bg-cyan-600',
  },
  {
    to:    '/produksi/laporan-cooling',
    icon:  '❄️',
    title: 'Laporan Cooling',
    desc:  'Input laporan Cooling Staking',
    color: 'bg-violet-700',
  },
  {
    to:    '/produksi/laporan-imal',
    icon:  '🧪',
    title: 'Laporan IMAL',
    desc:  'Pemakaian Bahan Baku / Shift',
    color: 'bg-amber-700',
  },
];

const ProduksiDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">

        {/* ── Header ── */}
        <div className="dashboard-header">
          <h2>Dashboard Produksi</h2>
          <p>Selamat datang, <strong>{user?.name}</strong>. Anda dapat mengelola data produksi.</p>
        </div>

        {/* ── Card navigasi utama ── */}
        <div className="card-grid">
          <div className="card card-blue">
            <div className="card-icon">🏭</div>
            <div className="card-content">
              <h3>Data Produksi</h3>
              <p>Input dan kelola data produksi</p>
            </div>
          </div>

          <div className="card card-gray">
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>Data Sending</h3>
              <p>Lihat data pengiriman (read only)</p>
            </div>
          </div>

          <Link to="/produksi/history-laporan" className="card card-teal" style={{ textDecoration: 'none' }}>
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h3>History Laporan</h3>
              <p>Lihat semua laporan MDF</p>
            </div>
          </Link>
        </div>

        {/* ── Section: Input Laporan ── */}
        <div className="laporan-section">
          {/* Section header */}
          <div className="laporan-section-header">
            <h3 className="laporan-section-title">Input Laporan</h3>
            <p className="laporan-section-sub">Pilih jenis laporan yang ingin diisi</p>
          </div>

          {/* Grid 4 card — 1 kolom mobile, 2 tablet, 4 desktop */}
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

export default ProduksiDashboard;
