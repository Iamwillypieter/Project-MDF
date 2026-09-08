import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import TableSkeleton from '../components/ui/TableSkeleton';

const API_URL = `http://${window.location.hostname}:5000/api`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val) => {
  if (!val) return '-';
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

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    draft:     { cls: 'bg-slate-100 text-slate-600',   label: 'Draft'     },
    submitted: { cls: 'bg-blue-50  text-blue-700',     label: 'Submitted' },
    approved:  { cls: 'bg-emerald-50 text-emerald-700', label: 'Approved'  },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * HistoryQcLab — /qclab/history
 * Menampilkan riwayat Quality Shift Report (In-Process Testing)
 */
const HistoryQcLab = () => {
  const { token, user } = useAuth();
  const canEdit = user?.role === 'qc_lab' || user?.role === 'admin';

  const [shiftReports, setShiftReports] = useState([]);
  const [loadingShift, setLoadingShift] = useState(true);
  const [errorShift,   setErrorShift]   = useState('');
  const [filterShift,  setFilterShift]  = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API_URL}/laporan-qclab-shift`, { headers })
      .then(r => setShiftReports(r.data.laporan || []))
      .catch(e => setErrorShift(e.response?.data?.message || 'Gagal memuat data'))
      .finally(() => setLoadingShift(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredShift = shiftReports.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = filterShift.toLowerCase();
    const matchText = !q
      || (r.shift_group   ?? '').toLowerCase().includes(q)
      || (r.nik_nama_1    ?? '').toLowerCase().includes(q)
      || (r.nik_nama_2    ?? '').toLowerCase().includes(q)
      || (r.operator_name ?? '').toLowerCase().includes(q)
      || formatDate(r.tanggal).toLowerCase().includes(q);
    return matchStatus && matchText;
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">History Laporan QC Lab</h1>
            <p className="text-sm text-slate-500 mt-1">
              Riwayat Quality Shift Report — In-Process Testing.
            </p>
          </div>

          {/* Tombol Buat Laporan Baru */}
          {canEdit && (
            <Link
              to="/qclab/quality-shift-report"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                         text-white bg-teal-600 hover:bg-teal-700 transition-colors no-underline"
            >
              + Quality Shift Report
            </Link>
          )}
        </div>

        {/* ── Tabel Quality Shift Report ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Card header + filters */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Quality Shift Report — In-Process Testing
                  </h2>
                  <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2.5 py-1 rounded-full">
                    {filteredShift.length} / {shiftReports.length} laporan
                  </span>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  {/* Filter status */}
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg
                               focus:ring-1 focus:ring-teal-500 focus:border-teal-500
                               bg-white text-slate-700"
                  >
                    <option value="all">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                  </select>

                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      value={filterShift}
                      onChange={e => setFilterShift(e.target.value)}
                      placeholder="Cari shift, nama, tanggal..."
                      className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg w-52
                                 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {errorShift && (
              <div className="px-6 py-4 text-sm text-red-600 bg-red-50">❌ {errorShift}</div>
            )}

            {loadingShift ? (
              <div className="p-6"><TableSkeleton rows={5} cols={7} /></div>
            ) : filteredShift.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <div className="text-4xl mb-3">📋</div>
                {shiftReports.length === 0 ? (
                  <>
                    Belum ada laporan.{' '}
                    {canEdit && (
                      <Link to="/qclab/quality-shift-report"
                        className="text-teal-600 hover:underline font-medium">
                        Buat laporan pertama →
                      </Link>
                    )}
                  </>
                ) : (
                  'Tidak ada laporan yang sesuai filter.'
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 w-10">No</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Shift / Group</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Pemeriksa</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Kondisi Lampu</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Lokasi</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Dibuat</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShift.map((row, idx) => (
                      <tr key={row.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {formatDate(row.tanggal)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {row.shift_group || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed">
                          {row.nik_nama_1 && <div>{row.nik_nama_1}</div>}
                          {row.nik_nama_2 && <div className="text-slate-400">{row.nik_nama_2}</div>}
                          {!row.nik_nama_1 && !row.nik_nama_2 && <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            row.kondisi_lampu === 'OK'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {row.kondisi_lampu || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            row.lokasi_kerja === 'Bersih'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {row.lokasi_kerja || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          <div>{formatDateTime(row.created_at)}</div>
                          {row.operator_name && (
                            <div className="text-slate-400 mt-0.5">{row.operator_name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <Link
                              to={`/qclab/quality-shift-report/detail/${row.id}`}
                              className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline whitespace-nowrap"
                            >
                              Detail
                            </Link>
                            {canEdit && (
                              <Link
                                to={`/qclab/quality-shift-report/edit/${row.id}`}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      </main>
    </div>
  );
};

export default HistoryQcLab;
