import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TabelDataLog from '../components/laporan-chipper/TabelDataLog';
import TabelHambatan from '../components/laporan-mdf/TabelHambatan';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL   = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_chipper_draft';

// ── Nilai awal 1 baris data log ────────────────────────────────
const emptyLogRow = () => ({
  shift: '', log_rambung: '', bungker_jam: '',
  bungker_201: '', bungker_202: '', bahan_bakar_barkmill: '', keterangan: '',
});

// ── Nilai awal 1 baris hambatan ────────────────────────────────
const emptyHambatanRow = () => ({
  dari: '', sampai: '', keterangan: '', bagian: '', dilaporkan_oleh: '',
});

// ── Single Source of Truth ─────────────────────────────────────
const initialState = { data_log: [], hambatan: [] };

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/**
 * LaporanChipper — dual-mode CREATE / EDIT
 *
 * CREATE : /produksi/laporan-chipper
 *   • Draft otomatis disimpan ke localStorage setiap perubahan
 *   • Restore draft saat mount
 *   • Draft dihapus setelah submit sukses
 *
 * EDIT   : /produksi/laporan-chipper/edit/:id
 *   • Pre-fill dari DB via useEffect watch [id]
 *   • Tidak menyentuh localStorage
 */
const LaporanChipper = () => {
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
        const res = await axios.get(`${API_URL}/laporan-chipper/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          data_log: Array.isArray(d.data_log) ? d.data_log : [],
          hambatan: Array.isArray(d.hambatan) ? d.hambatan : [],
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };
    prefill();
  }, [id]);

  // ── Handlers data log ──────────────────────────────────────────
  const handleLogChange = (rowIdx, key, value) => {
    setFormData(prev => ({
      ...prev,
      data_log: prev.data_log.map((row, i) =>
        i === rowIdx ? { ...row, [key]: value } : row
      ),
    }));
  };
  const handleAddLog    = () => setFormData(prev => ({ ...prev, data_log: [...prev.data_log, emptyLogRow()] }));
  const handleDeleteLog = (i) => setFormData(prev => ({ ...prev, data_log: prev.data_log.filter((_, idx) => idx !== i) }));

  // ── Handlers hambatan ──────────────────────────────────────────
  const handleHambatanChange = (rowIdx, key, value) => {
    setFormData(prev => ({
      ...prev,
      hambatan: prev.hambatan.map((row, i) =>
        i === rowIdx ? { ...row, [key]: value } : row
      ),
    }));
  };
  const handleAddHambatan    = () => setFormData(prev => ({ ...prev, hambatan: [...prev.hambatan, emptyHambatanRow()] }));
  const handleDeleteHambatan = (i) => setFormData(prev => ({ ...prev, hambatan: prev.hambatan.filter((_, idx) => idx !== i) }));

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

    const payload = {
      data_log: formData.data_log,   // array → JSONB
      hambatan: formData.hambatan,   // array → JSONB
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-chipper/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan Chipper #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-chipper`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan Chipper #${res.data.id} berhasil disimpan.`);
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

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Chipper MDF</h1>
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
            <span>Disimpan Sebagai Draft.</span>
            <button onClick={handleReset}
              className="text-xs font-semibold underline hover:text-amber-900 whitespace-nowrap">
              Hapus Draft
            </button>
          </div>
        )}

        {/* ── Alert fetchError ── */}
        {fetchError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ❌ {fetchError}
          </div>
        )}

        {/* ── Alert sukses ── */}
        {submitSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
            ✅ {submitSuccess}
          </div>
        )}

        {/* ── Alert error submit ── */}
        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ❌ {submitError}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

            {/* Bagian Atas: Tabel Data Log & Bungker */}
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Data Log &amp; Bungker
            </h2>

            <TabelDataLog
              rows={formData.data_log}
              onChange={handleLogChange}
              onAddRow={handleAddLog}
              onDeleteRow={handleDeleteLog}
              disabled={isSubmitting}
            />

            <hr className="my-6 border-slate-100" />

            {/* Bagian Bawah: Tabel Hambatan — reuse komponen yang sudah ada */}
            <TabelHambatan
              rows={formData.hambatan}
              onChange={handleHambatanChange}
              onAddRow={handleAddHambatan}
              onDeleteRow={handleDeleteHambatan}
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

export default LaporanChipper;
