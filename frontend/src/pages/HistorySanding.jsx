import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import TableSkeleton from '../components/ui/TableSkeleton';

const API_URL = `http://${window.location.hostname}:5000/api`;

const formatDate = (val) => {
  if (!val) return '-';
  // tanggal bisa berupa ISO string atau date-only string
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * HistorySanding — /sending/history-laporan
 * Menampilkan riwayat laporan sanding & kertas pasir milik role sending.
 */
const HistorySanding = () => {
  const { token } = useAuth();

  const [laporanSanding,     setLaporanSanding]     = useState([]);
  const [laporanKertasPasir, setLaporanKertasPasir] = useState([]);
  const [loadingSanding,     setLoadingSanding]     = useState(true);
  const [loadingKertas,      setLoadingKertas]      = useState(true);
  const [errorSanding,       setErrorSanding]       = useState('');
  const [errorKertas,        setErrorKertas]        = useState('');
  const [activeTab,          setActiveTab]          = useState('sanding'); // 'sanding' | 'kertas'

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch kedua tabel paralel
    axios.get(`${API_URL}/laporan-sanding`, { headers })
      .then(r => setLaporanSanding(r.data.laporan || []))
      .catch(e => setErrorSanding(e.response?.data?.message || 'Gagal memuat data'))
      .finally(() => setLoadingSanding(false));

    axios.get(`${API_URL}/laporan-kertas-pasir`, { headers })
      .then(r => setLaporanKertasPasir(r.data.laporan || []))
      .catch(e => setErrorKertas(e.response?.data?.message || 'Gagal memuat data'))
      .finally(() => setLoadingKertas(false));
  }, [token]);

  // Hitung total M3 dari grading object
  const totalM3 = (grading) => {
    if (!grading || typeof grading !== 'object') return 0;
    return Object.values(grading)
      .reduce((sum, g) => sum + (parseFloat(g?.m3) || 0), 0)
      .toFixed(4);
  };

  // Hitung total pcs dari grading object
  const totalPcs = (grading) => {
    if (!grading || typeof grading !== 'object') return 0;
    return Object.values(grading)
      .reduce((sum, g) => sum + (parseInt(g?.pcs) || 0), 0);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">History Laporan Sending</h1>
            <p className="text-sm text-slate-500 mt-1">
              Riwayat laporan Sanding / Grading MDF dan Pemakaian Kertas Pasir.
            </p>
          </div>

          {/* Tombol Buat Laporan Baru */}
          <div className="flex gap-2">
            <Link
              to="/sending/laporan-hasil-sanding"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                         text-white bg-purple-600 hover:bg-purple-700 transition-colors no-underline"
            >
              + Laporan Sanding
            </Link>
            <Link
              to="/sending/laporan-kertas-pasir"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                         text-white bg-orange-500 hover:bg-orange-600 transition-colors no-underline"
            >
              + Kertas Pasir
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('sanding')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'sanding'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📊 Laporan Sanding / Grading
          </button>
          <button
            onClick={() => setActiveTab('kertas')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'kertas'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📋 Pemakaian Kertas Pasir
          </button>
        </div>

        {/* ── Tab: Laporan Sanding ── */}
        {activeTab === 'sanding' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Laporan Hasil Sanding / Grading MDF
              </h2>
              <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-1 rounded-full">
                {laporanSanding.length} laporan
              </span>
            </div>

            {errorSanding && (
              <div className="px-6 py-4 text-sm text-red-600 bg-red-50">❌ {errorSanding}</div>
            )}

            {loadingSanding ? (
              <TableSkeleton rows={4} cols={6} />
            ) : laporanSanding.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <div className="text-4xl mb-3">📊</div>
                Belum ada laporan sanding.{' '}
                <Link to="/sending/laporan-hasil-sanding" className="text-purple-600 hover:underline font-medium">
                  Buat laporan pertama →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">No</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Tanggal Produksi</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Group</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Tebal (mm)</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600">Total Pcs</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600">Total M³</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Dibuat</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Operator</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporanSanding.map((row, idx) => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{formatDate(row.tanggal_produksi)}</td>
                        <td className="py-3 px-4 text-slate-700">{row.group || '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{row.ukuran_tebal ?? '-'}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{totalPcs(row.grading).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-blue-700">{totalM3(row.grading)}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{formatDateTime(row.created_at)}</td>
                        <td className="py-3 px-4 text-slate-600">{row.operator_name || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            to={`/sending/laporan-hasil-sanding/edit/${row.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Laporan Kertas Pasir ── */}
        {activeTab === 'kertas' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Laporan Pemakaian Kertas Pasir
              </h2>
              <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">
                {laporanKertasPasir.length} laporan
              </span>
            </div>

            {errorKertas && (
              <div className="px-6 py-4 text-sm text-red-600 bg-red-50">❌ {errorKertas}</div>
            )}

            {loadingKertas ? (
              <TableSkeleton rows={4} cols={4} />
            ) : laporanKertasPasir.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <div className="text-4xl mb-3">📋</div>
                Belum ada laporan kertas pasir.{' '}
                <Link to="/sending/laporan-kertas-pasir" className="text-orange-600 hover:underline font-medium">
                  Buat laporan pertama →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">No</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Tanggal</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600">Jumlah Transaksi</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Keterangan</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Dibuat</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Operator</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporanKertasPasir.map((row, idx) => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{formatDate(row.tanggal)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {Array.isArray(row.transaksi) ? row.transaksi.length : 0}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {row.keterangan || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{formatDateTime(row.created_at)}</td>
                        <td className="py-3 px-4 text-slate-600">{row.operator_name || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            to={`/sending/laporan-kertas-pasir/edit/${row.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default HistorySanding;
