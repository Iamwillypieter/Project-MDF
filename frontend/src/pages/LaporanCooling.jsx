import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TabelStaking from '../components/laporan-cooling/TabelStaking';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL   = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_cooling_draft';

// ── Template 1 baris kosong ────────────────────────────────────
const emptyRow = () => ({
  shift: '', tgl_produksi: '', kode_produksi: '', raw_thickness: '', no_stack: '',
  grade_a: '', grade_b: '', alas: '',
  // total_lbr tidak disimpan di state — dihitung saat render di TabelStaking
  seksi: '', kolom: '', baris: '',
  keterangan: '',
});

const initialState = { rows: [] };

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/**
 * LaporanCooling — dual-mode CREATE / EDIT
 *
 * CREATE : /produksi/laporan-cooling
 *   • Draft otomatis ke localStorage setiap perubahan state
 *   • Restore draft saat mount
 *   • Draft dihapus setelah submit sukses
 *
 * EDIT   : /produksi/laporan-cooling/edit/:id
 *   • Pre-fill dari DB via useEffect watch [id]
 *   • Tidak menyentuh localStorage
 */
const LaporanCooling = () => {
  const { id }     = useParams();
  const isEditMode = Boolean(id);
  const { token }  = useAuth();
  const navigate   = useNavigate();

  const [formData, setFormData] = useState(() => {
    if (isEditMode) return initialState;
    return readDraft() ?? initialState;
  });

  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isFetching,    setIsFetching]    = useState(false);
  const [submitError,   setSubmitError]   = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fetchError,    setFetchError]    = useState('');
  const [hasDraft,      setHasDraft]      = useState(!isEditMode && Boolean(readDraft()));

  // ── Persist draft (mode create) ───────────────────────────────
  useEffect(() => {
    if (isEditMode) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // ── Pre-fill dari DB (mode edit) ──────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    const prefill = async () => {
      setIsFetching(true);
      setFetchError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-cooling/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({ rows: Array.isArray(d.rows) ? d.rows : [] });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };
    prefill();
  }, [id]);

  // ── Handlers tabel baris ───────────────────────────────────────
  const handleRowChange = (rowIdx, key, value) => {
    setFormData(prev => ({
      rows: prev.rows.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r),
    }));
  };

  const handleAddRow    = () => setFormData(prev => ({ rows: [...prev.rows, emptyRow()] }));
  const handleDeleteRow = (i) => setFormData(prev => ({ rows: prev.rows.filter((_, idx) => idx !== i) }));

  // ── Reset ──────────────────────────────────────────────────────
  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); }
  };

  // ── Submit — single payload ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true); // set true sebelum hit API

    // Hitung total_lbr di setiap baris sebelum dikirim ke DB
    const rowsWithTotal = formData.rows.map(row => ({
      ...row,
      total_lbr: (parseFloat(row.grade_a) || 0)
               + (parseFloat(row.grade_b) || 0)
               + (parseFloat(row.alas)    || 0),
    }));

    const payload = { rows: rowsWithTotal };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-cooling/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan Cooling Staking #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-cooling`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan Cooling Staking #${res.data.id} berhasil disimpan.`);
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setFormData(initialState);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan laporan. Coba lagi.');
    } finally {
      setIsSubmitting(false); // wajib di finally
    }
  };

  // ── Loading prefill ────────────────────────────────────────────
  if (isFetching) {
    return (
      <LoadingState
        fullPage
        navbar={<Navbar />}
        message="Memuat data laporan..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-full mx-auto px-4 py-8" style={{ maxWidth: '1400px' }}>

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Cooling Staking</h1>
              {isEditMode && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700
                                 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Edit #{id}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {isEditMode ? 'Ubah data laporan lalu klik Simpan Perubahan.' : 'Isi form, lalu klik Simpan Laporan.'}
            </p>
          </div>
          {isEditMode && (
            <button onClick={() => navigate(-1)}
              className="text-sm text-slate-500 hover:text-slate-700">
              ← Kembali
            </button>
          )}
        </div>

        {/* ── Banner draft ── */}
        {!isEditMode && hasDraft && !submitSuccess && (
          <div className="mb-4 flex items-center justify-between gap-3
                          bg-amber-50 border border-amber-200 text-amber-800
                          text-sm rounded-lg px-4 py-3">
            <span>💾 Draft ditemukan. Form diisi otomatis dari sesi terakhir.</span>
            <button onClick={handleReset}
              className="text-xs font-semibold underline hover:text-amber-900 whitespace-nowrap">
              Hapus Draft
            </button>
          </div>
        )}

        {/* Alerts */}
        {fetchError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ❌ {fetchError}
          </div>
        )}
        {submitSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
            ✅ {submitSuccess}
          </div>
        )}
        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ❌ {submitError}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <TabelStaking
              rows={formData.rows}
              onChange={handleRowChange}
              onAddRow={handleAddRow}
              onDeleteRow={handleDeleteRow}
              disabled={isSubmitting}
            />
          </div>

          {/* ── Action buttons ── */}
          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600
                         bg-white border border-slate-300 hover:bg-slate-50
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Form
            </button>

            <SubmitButton
              isSubmitting={isSubmitting}
              label={isEditMode ? 'Simpan Perubahan' : 'Simpan Laporan'}
            />
          </div>
        </form>

      </main>
    </div>
  );
};

export default LaporanCooling;
