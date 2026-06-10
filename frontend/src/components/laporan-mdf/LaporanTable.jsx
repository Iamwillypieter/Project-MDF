import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatWIB } from '../../utils/formatTime';
import TableSkeleton from '../ui/TableSkeleton';
import Spinner from '../ui/Spinner';

const API_URL = `http://${window.location.hostname}:5000/api`;

// ── Konfigurasi per jenis laporan ─────────────────────────────
// Mudah ditambah jika ada laporan baru di masa mendatang
const JENIS_CONFIG = {
  produksi: {
    label:     'Produksi MDF',
    icon:      '🏭',
    badgeCls:  'bg-blue-50 text-blue-700',
    viewPath:  (id) => `/produksi/laporan-mdf/${id}`,
    editPath:  (id) => `/produksi/laporan-mdf/edit/${id}`,
    delEndpoint: (id) => `${API_URL}/laporan-mdf/${id}`,
  },
  chipper: {
    label:     'Chipper MDF',
    icon:      '🪚',
    badgeCls:  'bg-cyan-50 text-cyan-700',
    viewPath:  (id) => `/produksi/laporan-chipper/${id}`,
    editPath:  (id) => `/produksi/laporan-chipper/edit/${id}`,
    delEndpoint: (id) => `${API_URL}/laporan-chipper/${id}`,
  },
  cooling: {
    label:     'Cooling Staking',
    icon:      '❄️',
    badgeCls:  'bg-violet-50 text-violet-700',
    viewPath:  (id) => `/produksi/laporan-cooling/${id}`,
    editPath:  (id) => `/produksi/laporan-cooling/edit/${id}`,
    delEndpoint: (id) => `${API_URL}/laporan-cooling/${id}`,
  },
  imal: {
    label:     'IMAL',
    icon:      '🧪',
    badgeCls:  'bg-amber-50 text-amber-700',
    viewPath:  (id) => `/produksi/laporan-imal/${id}`,
    editPath:  (id) => `/produksi/laporan-imal/edit/${id}`,
    delEndpoint: (id) => `${API_URL}/laporan-imal/${id}`,
  },
};

const LaporanTable = ({ token, userRole }) => {
  const navigate = useNavigate();

  const [historyList,   setHistoryList]   = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [fetchError,    setFetchError]    = useState('');
  const [deletingId,    setDeletingId]    = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError,   setDeleteError]   = useState('');

  // ── Fetch semua 4 endpoint paralel saat mount ─────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setFetchError('');
      try {
        const [resMdf, resChipper, resCooling, resImal] = await Promise.all([
          axios.get(`${API_URL}/laporan-mdf`,     { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/laporan-chipper`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/laporan-cooling`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/laporan-imal`,    { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const tagged = [
          ...resMdf.data.laporan.map(i      => ({ ...i, jenis: 'produksi' })),
          ...resChipper.data.laporan.map(i  => ({ ...i, jenis: 'chipper'  })),
          ...resCooling.data.laporan.map(i  => ({ ...i, jenis: 'cooling'  })),
          ...resImal.data.laporan.map(i     => ({ ...i, jenis: 'imal'     })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setHistoryList(tagged);
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const handleView = (item) => navigate(JENIS_CONFIG[item.jenis].viewPath(item.id));
  const handleEdit = (item) => navigate(JENIS_CONFIG[item.jenis].editPath(item.id));

  // ── Delete — hanya admin ──────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id, jenis } = deleteConfirm;
    setDeletingId(`${jenis}-${id}`);
    setDeleteError('');
    try {
      await axios.delete(JENIS_CONFIG[jenis].delEndpoint(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryList(prev => prev.filter(i => !(i.id === id && i.jenis === jenis)));
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Gagal menghapus laporan.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) {
    return <TableSkeleton rows={6} cols={5} />;
  }

  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        ❌ {fetchError}
      </div>
    );
  }

  if (historyList.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-16
                      border border-dashed border-slate-200 rounded-xl bg-white">
        Belum ada laporan tersimpan.
      </div>
    );
  }

  return (
    <>
      {deleteError && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700
                        rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>❌ {deleteError}</span>
          <button onClick={() => setDeleteError('')}
            className="text-red-400 hover:text-red-600 text-lg leading-none ml-4">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-sm font-semibold text-slate-600">
            {historyList.length} dokumen tersimpan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide w-10">No</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">ID</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Jenis Laporan</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Tanggal (WIB)</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Operator</th>
                <th className="text-center px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {historyList.map((item, idx) => {
                const cfg = JENIS_CONFIG[item.jenis] ?? JENIS_CONFIG.produksi;
                return (
                  <tr key={`${item.jenis}-${item.id}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">

                    <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>

                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        #{item.id}
                      </span>
                    </td>

                    {/* Badge jenis laporan — driven by JENIS_CONFIG */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold
                                        px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-slate-700 text-xs">
                      {formatWIB(item.created_at)}
                    </td>

                    <td className="px-5 py-3 text-slate-700 text-sm">
                      {item.operator_name || '-'}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">

                        {/* View — semua role */}
                        <button onClick={() => handleView(item)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md
                                     bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                          Lihat
                        </button>

                        {/* Edit + Hapus — HANYA admin */}
                        {userRole === 'admin' && (
                          <>
                            <button onClick={() => handleEdit(item)}
                              className="px-3 py-1.5 text-xs font-medium rounded-md
                                         bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item)}
                              disabled={deletingId === `${item.jenis}-${item.id}`}
                              className="px-3 py-1.5 text-xs font-medium rounded-md
                                         bg-red-50 text-red-600 hover:bg-red-100 transition-colors
                                         disabled:opacity-50 disabled:cursor-not-allowed">
                              {deletingId === `${item.jenis}-${item.id}` ? (
                                <span className="inline-flex items-center gap-1">
                                  <Spinner size="sm" className="text-red-600" />
                                  Hapus
                                </span>
                              ) : 'Hapus'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal konfirmasi hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !deletingId && setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-500 mb-3">Yakin ingin menghapus laporan berikut?</p>
            <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4 text-sm flex items-center gap-2">
              <span className="font-mono text-slate-600">#{deleteConfirm.id}</span>
              <span className="text-slate-300">·</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                                ${JENIS_CONFIG[deleteConfirm.jenis]?.badgeCls}`}>
                {JENIS_CONFIG[deleteConfirm.jenis]?.icon} {JENIS_CONFIG[deleteConfirm.jenis]?.label}
              </span>
            </div>
            <p className="text-xs text-red-500 mb-5">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={!!deletingId}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100
                           hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={!!deletingId}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600
                           hover:bg-red-700 rounded-lg disabled:opacity-60
                           disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {deletingId ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Menghapus...
                  </>
                ) : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LaporanTable;
