import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import ParameterGrid from '../components/laporan-mdf/ParameterGrid';
import TabelHambatan from '../components/laporan-mdf/TabelHambatan';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL  = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_mdf_draft'; // key localStorage untuk draft form

const emptyParam = {
  raw_thickness: '', fin_thickness: '',
  good_board: '', total_reject: '',
  gluemix: '', paraffin: '', fibre: '', wood: '', jenis: '',
};

const emptyHambatanRow = () => ({
  dari: '', sampai: '', keterangan: '', bagian: '', dilaporkan_oleh: '',
});

const initialState = {
  kiri:     { ...emptyParam },
  kanan:    { ...emptyParam },
  hambatan: [],
};

/**
 * Baca draft dari localStorage.
 * Hanya dipakai pada mode create — mode edit selalu fetch dari DB.
 */
const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * LaporanMdf — dual-mode: CREATE dan EDIT
 *
 * Mode create  : /produksi/laporan-mdf
 *   - State form di-persist ke localStorage tiap kali berubah
 *   - Saat mount, cek apakah ada draft tersimpan → restore otomatis
 *   - Setelah submit sukses → draft dihapus + form di-reset
 *
 * Mode edit    : /produksi/laporan-mdf/edit/:id
 *   - Form di-prefill dari DB berdasarkan :id (useEffect watch [id])
 *   - Tidak menyentuh localStorage
 */
const LaporanMdf = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { token } = useAuth();
  const navigate  = useNavigate();

  // ── Inisialisasi state: cek draft localStorage dulu (mode create only) ──
  const [formData, setFormData] = useState(() => {
    if (isEditMode) return initialState; // edit mode — jangan pakai draft
    const draft = readDraft();
    return draft ?? initialState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching,   setIsFetching]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fetchError,   setFetchError]   = useState('');
  const [hasDraft,     setHasDraft]     = useState(
    !isEditMode && Boolean(readDraft())
  );

  // ── Persist draft ke localStorage setiap formData berubah (mode create) ──
  useEffect(() => {
    if (isEditMode) return; // jangan simpan draft saat edit
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // ── Pre-fill form dari DB saat mode edit ──────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;

    const prefillForm = async () => {
      setIsFetching(true);
      setFetchError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-mdf/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          kiri: {
            raw_thickness: d.kiri_raw_thickness ?? '',
            fin_thickness: d.kiri_fin_thickness ?? '',
            good_board:    d.kiri_good_board    ?? '',
            total_reject:  d.kiri_total_reject  ?? '',
            gluemix:       d.kiri_gluemix       ?? '',
            paraffin:      d.kiri_paraffin      ?? '',
            fibre:         d.kiri_fibre         ?? '',
            wood:          d.kiri_wood          ?? '',
            jenis:         d.kiri_jenis         ?? '',
          },
          kanan: {
            raw_thickness: d.kanan_raw_thickness ?? '',
            fin_thickness: d.kanan_fin_thickness ?? '',
            good_board:    d.kanan_good_board    ?? '',
            total_reject:  d.kanan_total_reject  ?? '',
            gluemix:       d.kanan_gluemix       ?? '',
            paraffin:      d.kanan_paraffin      ?? '',
            fibre:         d.kanan_fibre         ?? '',
            wood:          d.kanan_wood          ?? '',
            jenis:         d.kanan_jenis         ?? '',
          },
          hambatan: Array.isArray(d.hambatan) ? d.hambatan : [],
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };

    prefillForm();
  }, [id]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleParamChange = (sisi, key, value) => {
    setFormData(prev => ({
      ...prev,
      [sisi]: { ...prev[sisi], [key]: value },
    }));
  };

  const handleHambatanChange = (rowIdx, key, value) => {
    setFormData(prev => ({
      ...prev,
      hambatan: prev.hambatan.map((row, i) =>
        i === rowIdx ? { ...row, [key]: value } : row
      ),
    }));
  };

  const handleAddRow = () => {
    setFormData(prev => ({
      ...prev,
      hambatan: [...prev.hambatan, emptyHambatanRow()],
    }));
  };

  const handleDeleteRow = (rowIdx) => {
    setFormData(prev => ({
      ...prev,
      hambatan: prev.hambatan.filter((_, i) => i !== rowIdx),
    }));
  };

  // ── Reset — bersihkan juga draft ─────────────────────────────────────────
  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    // Helper: hitung derived value untuk payload
    const calcM3 = (board, finThickness) => {
      const b = parseFloat(board);
      const f = parseFloat(finThickness);
      if (isNaN(b) || isNaN(f)) return null;
      return parseFloat(((b * f * 2.44 * 3.66) / 1000).toFixed(4));
    };

    const calcSum = (...vals) => {
      const nums = vals.map(v => parseFloat(v)).filter(v => !isNaN(v));
      return nums.length ? parseFloat(nums.reduce((a, b) => a + b, 0).toFixed(4)) : null;
    };

    // Derived values kiri
    const kiri_m3_goodboard   = calcM3(formData.kiri.good_board,   formData.kiri.fin_thickness);
    const kiri_m3_reject      = calcM3(formData.kiri.total_reject,  formData.kiri.fin_thickness);
    const kiri_total_board    = calcSum(formData.kiri.good_board,   formData.kiri.total_reject);
    const kiri_total_board_m3 = calcSum(kiri_m3_goodboard, kiri_m3_reject);

    // Derived values kanan
    const kanan_m3_goodboard   = calcM3(formData.kanan.good_board,  formData.kanan.fin_thickness);
    const kanan_m3_reject      = calcM3(formData.kanan.total_reject, formData.kanan.fin_thickness);
    const kanan_total_board    = calcSum(formData.kanan.good_board,  formData.kanan.total_reject);
    const kanan_total_board_m3 = calcSum(kanan_m3_goodboard, kanan_m3_reject);

    const payload = {
      // Kiri — input fields
      kiri_raw_thickness:   formData.kiri.raw_thickness  || null,
      kiri_fin_thickness:   formData.kiri.fin_thickness  || null,
      kiri_good_board:      formData.kiri.good_board     || null,
      kiri_total_reject:    formData.kiri.total_reject   || null,
      kiri_gluemix:         formData.kiri.gluemix        || null,
      kiri_paraffin:        formData.kiri.paraffin       || null,
      kiri_fibre:           formData.kiri.fibre          || null,
      kiri_wood:            formData.kiri.wood           || null,
      kiri_jenis:           formData.kiri.jenis          || null,
      // Kiri — derived (kalkulasi otomatis, ikut dalam payload)
      kiri_m3_goodboard,
      kiri_m3_reject,
      kiri_total_board,
      kiri_total_board_m3,

      // Kanan — input fields
      kanan_raw_thickness:  formData.kanan.raw_thickness || null,
      kanan_fin_thickness:  formData.kanan.fin_thickness || null,
      kanan_good_board:     formData.kanan.good_board    || null,
      kanan_total_reject:   formData.kanan.total_reject  || null,
      kanan_gluemix:        formData.kanan.gluemix       || null,
      kanan_paraffin:       formData.kanan.paraffin      || null,
      kanan_fibre:          formData.kanan.fibre         || null,
      kanan_wood:           formData.kanan.wood          || null,
      kanan_jenis:          formData.kanan.jenis         || null,
      // Kanan — derived
      kanan_m3_goodboard,
      kanan_m3_reject,
      kanan_total_board,
      kanan_total_board_m3,

      hambatan: formData.hambatan,
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-mdf/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-mdf`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${res.data.id} berhasil disimpan.`);
        // Hapus draft setelah berhasil simpan
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setFormData(initialState);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan laporan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading prefill (edit mode) ───────────────────────────────────────────
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

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Produksi MDF</h1>
              {isEditMode && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700
                                 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Edit #{id}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {isEditMode
                ? 'Ubah data laporan lalu klik Simpan Perubahan.'
                : 'Isi seluruh form, lalu klik Simpan Laporan.'}
            </p>
          </div>
          {isEditMode && (
            <button
              onClick={() => navigate(`/produksi/laporan-mdf/${id}`)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Lihat Detail
            </button>
          )}
        </div>

        {/* ── Banner draft tersimpan — hanya mode create ── */}
        {!isEditMode && hasDraft && !submitSuccess && (
          <div className="mb-4 flex items-center justify-between gap-3
                          bg-amber-50 border border-amber-200 text-amber-800
                          text-sm rounded-lg px-4 py-3">
            <span>Disimpan Sebagai Draft.</span>
            <button
              onClick={handleReset}
              className="text-xs font-semibold underline hover:text-amber-900 whitespace-nowrap"
            >
              Hapus Draft
            </button>
          </div>
        )}

        {/* Alert error prefill */}
        {fetchError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700
                          text-sm rounded-lg px-4 py-3">
            ❌ {fetchError}
          </div>
        )}

        {/* Alert sukses */}
        {submitSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800
                          text-sm rounded-lg px-4 py-3">
            ✅ {submitSuccess}
          </div>
        )}

        {/* Alert error submit */}
        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700
                          text-sm rounded-lg px-4 py-3">
            ❌ {submitError}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Parameter Produksi
            </h2>

            <div className="flex gap-4 flex-col sm:flex-row">
              <ParameterGrid
                title="KIRI" sisi="kiri"
                data={formData.kiri}
                onChange={handleParamChange}
                disabled={isSubmitting}
              />
              <ParameterGrid
                title="KANAN" sisi="kanan"
                data={formData.kanan}
                onChange={handleParamChange}
                disabled={isSubmitting}
              />
            </div>

            <hr className="my-6 border-slate-100" />

            <TabelHambatan
              rows={formData.hambatan}
              onChange={handleHambatanChange}
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

export default LaporanMdf;
