import { Link } from 'react-router-dom';
import './LaporanMdfCard.css';

/**
 * LaporanMdfCard
 * Card navigasi menuju halaman Laporan Produksi MDF.
 * Dibungkus <Link> untuk navigasi deklaratif — tidak ada onClick/navigate manual.
 */
const LaporanMdfCard = () => {
  return (
    <Link to="/produksi/laporan-mdf" className="laporan-card">
      <div className="laporan-card-icon">📋</div>
      <div className="laporan-card-content">
        <h3>Laporan MDF</h3>
        <p>Input dan lihat laporan produksi MDF</p>
      </div>
    </Link>
  );
};

export default LaporanMdfCard;
