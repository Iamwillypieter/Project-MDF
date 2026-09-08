import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const roleLabel = {
  admin:    'Admin',
  produksi: 'Produksi',
  sending:  'Sending',
  qc_lab:   'QC Lab',
};

const dashboardPath = {
  admin:    '/admin/dashboard',
  produksi: '/produksi/dashboard',
  sending:  '/sending/dashboard',
  qc_lab:   '/qclab/dashboard',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOnDashboard = location.pathname === dashboardPath[user?.role];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span
          className="navbar-brand"
          onClick={() => navigate(dashboardPath[user?.role])}
          style={{ cursor: 'pointer' }}
        >
          MDF System
        </span>
        {!isOnDashboard && (
          <button
            className="btn-back"
            onClick={() => navigate(dashboardPath[user?.role])}
          >
            ← Dashboard
          </button>
        )}
      </div>
      <div className="navbar-user">
        <span className="navbar-name">{user?.name}</span>
        <span className={`navbar-role role-${user?.role}`}>{roleLabel[user?.role]}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
