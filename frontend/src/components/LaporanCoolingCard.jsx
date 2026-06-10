import { Link } from 'react-router-dom';
import './LaporanMdfCard.css';

const LaporanCoolingCard = () => {
  return (
    <Link
      to="/produksi/laporan-cooling"
      className="laporan-card"
      style={{ backgroundColor: '#7c3aed' }} /* violet-700 */
    >
      <div className="laporan-card-icon">❄️</div>
      <div className="laporan-card-content">
        <h3>Laporan Cooling</h3>
        <p>Input laporan Cooling Staking</p>
      </div>
    </Link>
  );
};

export default LaporanCoolingCard;
