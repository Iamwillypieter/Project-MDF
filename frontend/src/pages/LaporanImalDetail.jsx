import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TabelImal from '../components/laporan-imal/TabelImal';
import { useAuth } from '../context/AuthContext';
import { formatWIB } from '../utils/formatTime';
import LoadingState from '../components/ui/LoadingState';
import Spinner from '../components/ui/Spinner';

const API_URL = `http://${window.location.hostname}:5000/api`;

/**
 * LaporanImalDetail — halaman view + verifikasi
 *
 * Semua input di-disable (read-only).
 * Jika userRole === 'admin' dan dokumen masih 'pending',
 * tampilkan tombol "Verifikasi / Periksa" untuk sign-off digital.
 */
const LaporanImalDetail = () => {
  const { id }      = useParams();
  const { token, user } = useAuth();
  const navigate    = useNavigate();

  const [laporan,      setLaporan]      = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [isVerifying,  setIsVerifying]  = useState(false);
  const [verifyError,  setVerifyError]  = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(`${API_URL}/laporan-imal/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLaporan(res.data.laporan);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // ── Tombol verifikasi — hanya admin ───────────────────────────
  const handleVerifikasi = async () => {
    setIsVerifying(true);
    setVerifyError('');
    try {
      const res = await axios.patch(`${API_URL}/laporan-imal/${id}/verifikasi`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVerifySuccess(`Laporan berhasil diverifikasi oleh ${res.data.diperiksa_oleh}.`);
      fetchData(); // refresh data untuk tampilkan status terbaru
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Gagal melakukan verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Cek apakah masih ada shift yang pending
  const hasPending = laporan?.shifts?.some(s => s.diperiksa_status !== 'verified');

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

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
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
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                Pemakaian Bahan Baku / Shift (IMAL)
              </h1>
              <span className="text-xs font-semibold bg-slate-200 text-slate-600
                               px-2 py-0.5 rounded-full uppercase tracking-wide">
                Read Only
              </span>
            </div>
            <p className="text-sm text-slate-500">
              ID #{laporan?.id} &nbsp;·&nbsp;
              Dibuat oleh <strong>{laporan?.operator_name || '-'}</strong> &nbsp;·&nbsp;
              {formatWIB(laporan?.created_at)}
            </p>
          </div>
          <button onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700">
            ← Kembali
          </button>
        </div>

        {/* Alert verifikasi */}
        {verifySuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
            ✅ {verifySuccess}
          </div>
        )}
        {verifyError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ❌ {verifyError}
          </div>
        )}

        {/* Tombol Verifikasi — conditional: hanya admin + ada shift pending */}
        {user?.role === 'admin' && hasPending && !verifySuccess && (
          <div className="mb-5 flex items-center justify-between bg-amber-50
                          border border-amber-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">Dokumen menunggu verifikasi</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Klik tombol untuk menyetujui dokumen ini secara digital sebagai Shift Leader.
              </p>
            </div>
            <button
              onClick={handleVerifikasi}
              disabled={isVerifying}
              className="ml-4 px-4 py-2 rounded-lg text-sm font-semibold text-white
                         bg-green-600 hover:bg-green-700 transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center gap-2 whitespace-nowrap"
            >
              {isVerifying ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Memverifikasi...
                </>
              ) : '✅ Verifikasi / Periksa'}
            </button>
          </div>
        )}

        {/* Tabel read-only */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <TabelImal
            shifts={laporan?.shifts ?? []}
            onChange={() => {}}
            onAddShift={() => {}}
            onDeleteShift={() => {}}
            currentUser={user}
            disabled={true}
          />
        </div>

      </main>
    </div>
  );
};

export default LaporanImalDetail;
