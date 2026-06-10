import { Link } from 'react-router-dom';
import './LaporanMdfCard.css';

const LaporanImalCard = () => {
  return (
    <Link
      to="/produksi/laporan-imal"
      className="laporan-card"
      style={{ backgroundColor: '#b45309' }} /* amber-700 */
    >
      <div className="laporan-card-icon">🧪</div>
      <div className="laporan-card-content">
        <h3>Laporan IMAL</h3>
        <p>Pemakaian Bahan Baku / Shift</p>
      </div>
    </Link>
  );
};

export default LaporanImalCard;
