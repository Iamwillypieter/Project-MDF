import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TabelStaking from '../components/laporan-cooling/TabelStaking';
import { useAuth } from '../context/AuthContext';
import { formatWIB } from '../utils/formatTime';
import LoadingState from '../components/ui/LoadingState';

const API_URL = `http://${window.location.hostname}:5000/api`;

const LaporanCoolingDetail = () => {
  const { id }    = useParams();
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [rows,      setRows]      = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchLaporan = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/laporan-cooling/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setRows(Array.isArray(d.rows) ? d.rows : []);
        setMeta({ id: d.id, created_at: d.created_at, operator_name: d.operator_name });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat laporan.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLaporan();
  }, [id]);

  if (isLoading) {
    return (
      <LoadingState
        fullPage
        navbar={<Navbar />}
        message="Memuat laporan..."
      />
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            ❌ {fetchError}
          </div>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-slate-500 hover:text-slate-700">
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-full px-4 py-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Cooling Staking</h1>
              <span className="text-xs font-semibold bg-slate-200 text-slate-600
                               px-2 py-0.5 rounded-full uppercase tracking-wide">
                Read Only
              </span>
            </div>
            <p className="text-sm text-slate-500">
              ID #{meta?.id} &nbsp;·&nbsp;
              Dibuat oleh <strong>{meta?.operator_name || '-'}</strong> &nbsp;·&nbsp;
              {formatWIB(meta?.created_at)}
            </p>
          </div>
          <button onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700">
            ← Kembali
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <TabelStaking
            rows={rows}
            onChange={() => {}}
            onAddRow={() => {}}
            onDeleteRow={() => {}}
            disabled
          />
        </div>

      </main>
    </div>
  );
};

export default LaporanCoolingDetail;
