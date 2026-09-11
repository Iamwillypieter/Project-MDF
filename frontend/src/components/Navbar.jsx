/**
 * Navbar – dengan logout loading state dan feedback visual
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from './ui/Spinner';
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // cegah double click
    setIsLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
    // setIsLoggingOut(false) tidak diperlukan karena komponen unmount setelah navigate
  };

  const isOnDashboard = location.pathname === dashboardPath[user?.role];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span
          className="navbar-brand"
          onClick={() => !isLoggingOut && navigate(dashboardPath[user?.role])}
          style={{ cursor: isLoggingOut ? 'default' : 'pointer' }}
        >
          MDF System
        </span>
        {!isOnDashboard && !isLoggingOut && (
          <button
            className="btn-back"
            onClick={() => navigate(dashboardPath[user?.role])}
          >
            ← Dashboard
          </button>
        )}
      </div>

      <div className="navbar-user">
        {!isLoggingOut && (
          <>
            <span className="navbar-name">{user?.name}</span>
            <span className={`navbar-role role-${user?.role}`}>
              {roleLabel[user?.role]}
            </span>
          </>
        )}

        <button
          className="btn-logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="btn-logout-loading">
              <Spinner size="sm" className="text-white" />
              Keluar...
            </span>
          ) : (
            'Logout'
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
