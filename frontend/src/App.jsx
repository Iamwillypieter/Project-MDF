import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProduksiDashboard from './pages/ProduksiDashboard';
import SendingDashboard from './pages/SendingDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ManajemenUser from './pages/ManajemenUser';
import LaporanMdf from './pages/LaporanMdf';
import LaporanDetail from './pages/LaporanDetail';
import LaporanChipper from './pages/LaporanChipper';
import LaporanChipperDetail from './pages/LaporanChipperDetail';
import HistoryLaporan from './pages/HistoryLaporan';
import LaporanCooling from './pages/LaporanCooling';
import LaporanCoolingDetail from './pages/LaporanCoolingDetail';
import LaporanImal from './pages/LaporanImal';
import LaporanImalDetail from './pages/LaporanImalDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Admin ─────────────────────────────────────────── */}
          <Route path="/admin/dashboard"
            element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
          />
          <Route path="/admin/users"
            element={<ProtectedRoute allowedRoles={['admin']}><ManajemenUser /></ProtectedRoute>}
          />

          {/* ── Produksi ──────────────────────────────────────── */}
          <Route path="/produksi/dashboard"
            element={<ProtectedRoute allowedRoles={['produksi']}><ProduksiDashboard /></ProtectedRoute>}
          />

          {/* History gabungan — semua role */}
          <Route path="/produksi/history-laporan"
            element={
              <ProtectedRoute allowedRoles={['produksi', 'admin', 'sending']}>
                <HistoryLaporan />
              </ProtectedRoute>
            }
          />

          {/* ── Laporan Produksi MDF ───────────────────────────── */}
          <Route path="/produksi/laporan-mdf"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanMdf /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-mdf/edit/:id"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanMdf /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-mdf/:id"
            element={
              <ProtectedRoute allowedRoles={['produksi', 'admin', 'sending']}>
                <LaporanDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Laporan Chipper MDF ────────────────────────────── */}
          <Route path="/produksi/laporan-chipper"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanChipper /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-chipper/edit/:id"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanChipper /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-chipper/:id"
            element={
              <ProtectedRoute allowedRoles={['produksi', 'admin', 'sending']}>
                <LaporanChipperDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Laporan Cooling Staking ───────────────────────── */}
          <Route path="/produksi/laporan-cooling"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanCooling /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-cooling/edit/:id"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanCooling /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-cooling/:id"
            element={
              <ProtectedRoute allowedRoles={['produksi', 'admin', 'sending']}>
                <LaporanCoolingDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Laporan IMAL ──────────────────────────────────── */}
          <Route path="/produksi/laporan-imal"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanImal /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-imal/edit/:id"
            element={<ProtectedRoute allowedRoles={['produksi', 'admin']}><LaporanImal /></ProtectedRoute>}
          />
          <Route path="/produksi/laporan-imal/:id"
            element={
              <ProtectedRoute allowedRoles={['produksi', 'admin', 'sending']}>
                <LaporanImalDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Sending ───────────────────────────────────────── */}
          <Route path="/sending/dashboard"
            element={<ProtectedRoute allowedRoles={['sending']}><SendingDashboard /></ProtectedRoute>}
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
