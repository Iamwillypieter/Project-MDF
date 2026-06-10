import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TabelDataLog from '../components/laporan-chipper/TabelDataLog';
import TabelHambatan from '../components/laporan-mdf/TabelHambatan';
import { useAuth } from '../context/AuthContext';
import { formatWIB } from '../utils/formatTime';
import LoadingState from '../components/ui/LoadingState';

const API_URL = `http://${window.location.hostname}:5000/api`;

const LaporanChipperDetail = () => {
  const { id }    = useParams();
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [formData,  setFormData]  = useState(null);
  const [meta,      setMeta]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchLaporan = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/laporan-chipper/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          data_log: Array.isArray(d.data_log) ? d.data_log : [],
          hambatan: Array.isArray(d.hambatan) ? d.hambatan : [],
        });
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
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Chipper MDF</h1>
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

        {/* Form read-only — semua field disabled */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Data Log &amp; Bungker
          </h2>
          <TabelDataLog
            rows={formData.data_log}
            onChange={() => {}}
            onAddRow={() => {}}
            onDeleteRow={() => {}}
            disabled
          />
          <hr className="my-6 border-slate-100" />
          <TabelHambatan
            rows={formData.hambatan}
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

export default LaporanChipperDetail;
