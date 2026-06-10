import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import ParameterGrid from '../components/laporan-mdf/ParameterGrid';
import TabelHambatan from '../components/laporan-mdf/TabelHambatan';
import { useAuth } from '../context/AuthContext';
import { formatWIB } from '../utils/formatTime';
import LoadingState from '../components/ui/LoadingState';

const API_URL = `http://${window.location.hostname}:5000/api`;

const LaporanDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [meta, setMeta]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Fetch dokumen berdasarkan :id saat mount ──────────────────
  useEffect(() => {
    const fetchLaporan = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/laporan-mdf/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;

        // Map flat DB row → struktur objek state form
        setFormData({
          kiri: {
            raw_thickness: d.kiri_raw_thickness ?? '',
            fin_thickness: d.kiri_fin_thickness ?? '',
            total_board:   d.kiri_total_board   ?? '',
            good_board:    d.kiri_good_board    ?? '',
            gluemix:       d.kiri_gluemix       ?? '',
            paraffin:      d.kiri_paraffin      ?? '',
            fibre:         d.kiri_fibre         ?? '',
            wood:          d.kiri_wood          ?? '',
            jenis:         d.kiri_jenis         ?? '',
          },
          kanan: {
            raw_thickness: d.kanan_raw_thickness ?? '',
            fin_thickness: d.kanan_fin_thickness ?? '',
            total_board:   d.kanan_total_board   ?? '',
            good_board:    d.kanan_good_board    ?? '',
            gluemix:       d.kanan_gluemix       ?? '',
            paraffin:      d.kanan_paraffin      ?? '',
            fibre:         d.kanan_fibre         ?? '',
            wood:          d.kanan_wood          ?? '',
            jenis:         d.kanan_jenis         ?? '',
          },
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
  }, [id]); // re-fetch jika id berubah

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LoadingState
        fullPage
        navbar={<Navbar />}
        message="Memuat laporan..."
      />
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            ❌ {fetchError}
          </div>
          <button onClick={() => navigate(-1)}
            className="mt-4 text-sm text-slate-500 hover:text-slate-700">
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Produksi MDF</h1>
              {/* Badge read-only */}
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
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            ← Kembali
          </button>
        </div>

        {/* Form — semua field disabled (read-only) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Parameter Produksi
          </h2>

          <div className="flex gap-4 flex-col sm:flex-row">
            <ParameterGrid title="KIRI"  sisi="kiri"  data={formData.kiri}  onChange={() => {}} disabled />
            <ParameterGrid title="KANAN" sisi="kanan" data={formData.kanan} onChange={() => {}} disabled />
          </div>

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

export default LaporanDetail;
