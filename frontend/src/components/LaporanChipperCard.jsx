import { Link } from 'react-router-dom';
import './LaporanMdfCard.css'; // reuse styling yang sudah ada, override warna lewat inline style

const LaporanChipperCard = () => {
  return (
    <Link
      to="/produksi/laporan-chipper"
      className="laporan-card"
      style={{ backgroundColor: '#0891b2' }} /* cyan-600 — beda warna dari MDF card */
    >
      <div className="laporan-card-icon">🪚</div>
      <div className="laporan-card-content">
        <h3>Laporan Chipper</h3>
        <p>Input dan lihat laporan Chipper MDF</p>
      </div>
    </Link>
  );
};

export default LaporanChipperCard;
