import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_qclab_draft';

// Pilihan jenis pengujian QC
const JENIS_UJI_OPTIONS = [
  'MOR (Modulus of Rupture)',
  'MOE (Modulus of Elasticity)',
  'IB (Internal Bond)',
  'Density',
  'Moisture Content',
  'Formaldehyde Emission',
  'Thickness Swelling',
  'Face Screw Withdrawal',
  'Lainnya',
];

const emptyHasilUji = () => ({
  jenis_uji:  '',
  nilai:      '',
  satuan:     '',
  standar:    '',
  status:     'pass', // 'pass' | 'fail'
  keterangan: '',
});

const initialState = {
  tanggal:         new Date().toISOString().split('T')[0],
  no_sampel:       '',
  produk:          '',
  tebal:           '',
  shift:           '',
  hasil_uji:       [],
  keterangan_umum: '',
};

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/**
 * LaporanQcLab — Form Laporan Kualitas / Pengujian QC
 * Mode: CREATE dan EDIT
 */
const LaporanQcLab = () => {
  const { id }     = useParams();
  const isEditMode = Boolean(id);
  const { token }  = useAuth();
  const navigate   = useNavigate();

  const [formData, setFormData] = useState(() => {
    if (isEditMode) return initialState;
    return readDraft() ?? initialState;
  });

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isFetching,   setIsFetching]     = useState(false);
  const [submitError,  setSubmitError]    = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fetchError,   setFetchError]     = useState('');
  const [hasDraft,     setHasDraft]       = useState(!isEditMode && Boolean(readDraft()));

  // Persist draft
  useEffect(() => {
    if (isEditMode) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // Pre-fill mode edit
  useEffect(() => {
    if (!isEditMode) return;
    const fetch = async () => {
      setIsFetching(true);
      try {
        const res = await axios.get(`${API_URL}/laporan-qclab/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          tanggal:         d.tanggal         ?? '',
          no_sampel:       d.no_sampel       ?? '',
          produk:          d.produk          ?? '',
          tebal:           d.tebal           ?? '',
          shift:           d.shift           ?? '',
          hasil_uji:       Array.isArray(d.hasil_uji) ? d.hasil_uji : [],
          keterangan_umum: d.keterangan_umum ?? '',
        });
      } catch (e) {
        setFetchError(e.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };
    fetch();
  }, [id, token]);

  // ── Field handlers ────────────────────────────────────────────
  const setField = (key, val) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  const handleHasilChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      hasil_uji: prev.hasil_uji.map((h, i) =>
        i === idx ? { ...h, [key]: val } : h
      ),
    }));

  const handleAddHasil = () =>
    setFormData(prev => ({ ...prev, hasil_uji: [...prev.hasil_uji, emptyHasilUji()] }));

  const handleDeleteHasil = (idx) =>
    setFormData(prev => ({
      ...prev,
      hasil_uji: prev.hasil_uji.filter((_, i) => i !== idx),
    }));

  // ── Reset ─────────────────────────────────────────────────────
  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!formData.tanggal || !formData.no_sampel || !formData.produk) {
      setSubmitError('Tanggal, No. Sampel, dan Produk wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const payload = { ...formData };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-qclab/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-qclab`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${res.data.id} berhasil disimpan.`);
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setFormData(initialState);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan laporan. Coba lagi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return <LoadingState fullPage navbar={<Navbar />} message="Memuat data laporan..." />;
  }

  // ── Input helper ──────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ' +
    'disabled:bg-slate-50 disabled:text-slate-400';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">
                Laporan Kualitas / Pengujian QC
              </h1>
              {isEditMode && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Edit #{id}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/qclab/dashboard')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
          </div>
          <p className="text-sm text-slate-600">PT CANANG INDAH - Particleboard & MDF Industries</p>
        </div>

        {/* Alerts */}
        {!isEditMode && hasDraft && !submitSuccess && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
            <span>Disimpan Sebagai Draft.</span>
            <button onClick={handleReset} className="text-xs font-semibold underline hover:text-amber-900">
              Hapus Draft
            </button>
          </div>
        )}
        {fetchError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">❌ {fetchError}</div>
        )}
        {submitSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">✅ {submitSuccess}</div>
        )}
        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">❌ {submitError}</div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Informasi Sampel ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Informasi Sampel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input type="date" value={formData.tanggal}
                  onChange={e => setField('tanggal', e.target.value)}
                  disabled={isSubmitting} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  No. Sampel <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formData.no_sampel}
                  onChange={e => setField('no_sampel', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: S-2024-001"
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Produk <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formData.produk}
                  onChange={e => setField('produk', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: MDF 12mm"
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tebal (mm)
                </label>
                <input type="number" step="0.01" value={formData.tebal}
                  onChange={e => setField('tebal', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: 12"
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Shift
                </label>
                <select value={formData.shift}
                  onChange={e => setField('shift', e.target.value)}
                  disabled={isSubmitting} className={inputCls}>
                  <option value="">-- Pilih Shift --</option>
                  <option value="1">Shift 1</option>
                  <option value="2">Shift 2</option>
                  <option value="3">Shift 3</option>
                </select>
              </div>

            </div>
          </div>

          {/* ── Tabel Hasil Uji ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Hasil Pengujian
              </h2>
              <button type="button" onClick={handleAddHasil} disabled={isSubmitting}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                <span className="text-lg">+</span> Tambah Uji
              </button>
            </div>

            {formData.hasil_uji.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Belum ada data pengujian. Klik "Tambah Uji" untuk menambahkan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 w-8">No</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Jenis Uji</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Nilai</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Satuan</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Standar</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Keterangan</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 w-14">Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.hasil_uji.map((h, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 text-center">{idx + 1}</td>

                        {/* Jenis Uji */}
                        <td className="py-2 px-3">
                          <select value={h.jenis_uji}
                            onChange={e => handleHasilChange(idx, 'jenis_uji', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50">
                            <option value="">-- Pilih --</option>
                            {JENIS_UJI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>

                        {/* Nilai */}
                        <td className="py-2 px-3">
                          <input type="number" step="0.001" value={h.nilai}
                            onChange={e => handleHasilChange(idx, 'nilai', e.target.value)}
                            disabled={isSubmitting} placeholder="0.00"
                            className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50" />
                        </td>

                        {/* Satuan */}
                        <td className="py-2 px-3">
                          <input type="text" value={h.satuan}
                            onChange={e => handleHasilChange(idx, 'satuan', e.target.value)}
                            disabled={isSubmitting} placeholder="N/mm²"
                            className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50" />
                        </td>

                        {/* Standar */}
                        <td className="py-2 px-3">
                          <input type="text" value={h.standar}
                            onChange={e => handleHasilChange(idx, 'standar', e.target.value)}
                            disabled={isSubmitting} placeholder="SNI / JIS"
                            className="w-28 px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50" />
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 text-center">
                          <select value={h.status}
                            onChange={e => handleHasilChange(idx, 'status', e.target.value)}
                            disabled={isSubmitting}
                            className={`px-2 py-1.5 border rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 ${
                              h.status === 'pass'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                : 'border-red-300 bg-red-50 text-red-700'
                            }`}>
                            <option value="pass">PASS</option>
                            <option value="fail">FAIL</option>
                          </select>
                        </td>

                        {/* Keterangan */}
                        <td className="py-2 px-3">
                          <input type="text" value={h.keterangan}
                            onChange={e => handleHasilChange(idx, 'keterangan', e.target.value)}
                            disabled={isSubmitting} placeholder="Opsional..."
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50" />
                        </td>

                        {/* Hapus */}
                        <td className="py-2 px-3 text-center">
                          <button type="button"
                            onClick={() => handleDeleteHasil(idx)}
                            disabled={isSubmitting}
                            className="text-red-500 hover:text-red-700 text-xl font-bold disabled:opacity-50"
                            title="Hapus baris">
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Keterangan Umum ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Keterangan Umum
            </h2>
            <textarea value={formData.keterangan_umum}
              onChange={e => setField('keterangan_umum', e.target.value)}
              disabled={isSubmitting} rows="3"
              placeholder="Catatan tambahan, kondisi pengujian, dll..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 resize-none" />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex justify-between items-center gap-3">
            <button type="button"
              onClick={() => navigate('/qclab/dashboard')}
              className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
              ← Kembali ke Dashboard
            </button>

            <div className="flex gap-3">
              <button type="button" onClick={handleReset} disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Reset Form
              </button>
              <SubmitButton
                isSubmitting={isSubmitting}
                label={isEditMode ? 'Simpan Perubahan' : 'Simpan Laporan'}
              />
            </div>
          </div>

        </form>
      </main>
    </div>
  );
};

export default LaporanQcLab;
