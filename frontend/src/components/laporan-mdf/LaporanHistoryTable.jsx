import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TableSkeleton from '../ui/TableSkeleton';

const API_URL = `http://${window.location.hostname}:5000/api`;

/**
 * LaporanHistoryTable
 * ─────────────────────────────────────────────────────────────────
 * Props:
 *   token    : JWT string dari AuthContext
 *   userRole : 'produksi' | 'admin' | 'sending'
 *   compact  : boolean — jika true, kurangi padding (dipakai dalam panel dashboard)
 */
const LaporanHistoryTable = ({ token, userRole, compact = false }) => {
  const navigate = useNavigate();
  const [history, setHistory]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Fetch on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setFetchError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-mdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data.laporan);
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat history laporan.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleView = (id) => navigate(`/produksi/laporan-mdf/${id}`);
  const handleEdit = (id) => navigate(`/produksi/laporan-mdf/edit/${id}`);

  const pad = compact ? 'p-4' : 'mt-8';

  return (
    <div className={pad}>
      {/* Header row */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">History Laporan</h2>
          {!isLoading && (
            <span className="text-xs text-slate-400">{history.length} dokumen</span>
          )}
        </div>
      )}
      {compact && !isLoading && (
        <p className="text-xs text-slate-400 mb-3 px-1">{history.length} dokumen tersimpan</p>
      )}

      {/* Loading state */}
      {isLoading && <TableSkeleton rows={5} cols={4} />}

      {/* Error state */}
      {!isLoading && fetchError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          ❌ {fetchError}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !fetchError && history.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-10 border border-dashed
                        border-slate-200 rounded-lg">
          Belum ada laporan tersimpan.
        </div>
      )}

      {/* Tabel history */}
      {!isLoading && !fetchError && history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  No
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  ID Laporan
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Tanggal Dibuat
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Operator
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Hambatan
                </th>
                <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600
                                     px-2 py-0.5 rounded">
                      #{item.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(item.created_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.operator_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {Array.isArray(item.hambatan)
                      ? `${item.hambatan.length} item`
                      : '0 item'}
                  </td>

                  {/* ── Kontrol Aksi berdasarkan role — tidak ada kebocoran edit ── */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">

                      {/* Tombol Lihat — semua role */}
                      <button
                        onClick={() => handleView(item.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md
                                   bg-slate-100 text-slate-700 hover:bg-slate-200
                                   transition-colors"
                      >
                        Lihat
                      </button>

                      {/* Tombol Edit — HANYA produksi, disembunyikan untuk admin & sending */}
                      {userRole === 'produksi' && (
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md
                                     bg-blue-50 text-blue-700 hover:bg-blue-100
                                     transition-colors"
                        >
                          Edit
                        </button>
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
  );
};

export default LaporanHistoryTable;
