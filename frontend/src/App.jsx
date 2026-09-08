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
import LaporanSanding from './pages/LaporanSanding';
import LaporanKertasPasir from './pages/LaporanKertasPasir';
import HistorySanding from './pages/HistorySanding';
import LaporanDailyTestSanding from './pages/LaporanDailyTestSanding';
import QcLabDashboard from './pages/QcLabDashboard';
import LaporanQcLab from './pages/LaporanQcLab';
import LaporanQcLabShiftReport from './pages/LaporanQcLabShiftReport';
import HistoryQcLab from './pages/HistoryQcLab';
import QcLabShiftReportDetail from './pages/QcLabShiftReportDetail';

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

          {/* History produksi — produksi, admin, sending, qc_lab bisa lihat */}
          <Route path="/produksi/history-laporan"
            element={
              <ProtectedRoute allowedRoles={['produksi', 'admin', 'sending', 'qc_lab']}>
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

          {/* ── Sending (termasuk Sanding — role digabung) ────── */}
          <Route path="/sending/dashboard"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><SendingDashboard /></ProtectedRoute>}
          />

          {/* History laporan sending — qc_lab juga bisa read */}
          <Route path="/sending/history-laporan"
            element={<ProtectedRoute allowedRoles={['sending', 'admin', 'qc_lab']}><HistorySanding /></ProtectedRoute>}
          />

          {/* Laporan Hasil Sanding / Grading MDF */}
          <Route path="/sending/laporan-hasil-sanding"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><LaporanSanding /></ProtectedRoute>}
          />
          <Route path="/sending/laporan-hasil-sanding/edit/:id"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><LaporanSanding /></ProtectedRoute>}
          />

          {/* Laporan Pemakaian Kertas Pasir */}
          <Route path="/sending/laporan-kertas-pasir"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><LaporanKertasPasir /></ProtectedRoute>}
          />
          <Route path="/sending/laporan-kertas-pasir/edit/:id"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><LaporanKertasPasir /></ProtectedRoute>}
          />

          {/* Daily Test Report — Sanding Line MDF */}
          <Route path="/sending/daily-test-report"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><LaporanDailyTestSanding /></ProtectedRoute>}
          />
          <Route path="/sending/daily-test-report/edit/:id"
            element={<ProtectedRoute allowedRoles={['sending', 'admin']}><LaporanDailyTestSanding /></ProtectedRoute>}
          />

          {/* ── QC Lab ────────────────────────────────────────── */}
          <Route path="/qclab/dashboard"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><QcLabDashboard /></ProtectedRoute>}
          />
          <Route path="/qclab/laporan-kualitas"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><LaporanQcLab /></ProtectedRoute>}
          />
          <Route path="/qclab/laporan-kualitas/edit/:id"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><LaporanQcLab /></ProtectedRoute>}
          />

          {/* Quality Shift Report — In-Process Testing */}
          <Route path="/qclab/quality-shift-report"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><LaporanQcLabShiftReport /></ProtectedRoute>}
          />
          <Route path="/qclab/quality-shift-report/edit/:id"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><LaporanQcLabShiftReport /></ProtectedRoute>}
          />
          <Route path="/qclab/quality-shift-report/detail/:id"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><QcLabShiftReportDetail /></ProtectedRoute>}
          />

          {/* History QC Lab — semua laporan */}
          <Route path="/qclab/history"
            element={<ProtectedRoute allowedRoles={['qc_lab', 'admin']}><HistoryQcLab /></ProtectedRoute>}
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
