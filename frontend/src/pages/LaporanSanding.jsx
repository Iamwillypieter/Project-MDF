import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_sanding_draft';

// Konstanta untuk kalkulasi M3
const PANJANG = 1.22; // meter
const LEBAR = 2.44;   // meter

const emptyHambatanRow = () => ({
  jam: '',
  hambatan: '',
});

const initialState = {
  ukuran_tebal: '',     // mm
  tanggal_produksi: new Date().toISOString().split('T')[0],
  group: '',
  grading: {
    A: { pcs: '', m3: 0 },
    B: { pcs: '', m3: 0 },
    CR: { pcs: '', m3: 0 },
    SU: { pcs: '', m3: 0 },
  },
  keterangan: '',
  hambatan: [],
};

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * LaporanSanding — Form Laporan Hasil Sanding / Grading MDF
 * Mode: CREATE dan EDIT
 */
const LaporanSanding = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => {
    if (isEditMode) return initialState;
    const draft = readDraft();
    return draft ?? initialState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [hasDraft, setHasDraft] = useState(!isEditMode && Boolean(readDraft()));

  // Persist draft ke localStorage (mode create only)
  useEffect(() => {
    if (isEditMode) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // Pre-fill form dari DB saat mode edit
  useEffect(() => {
    if (!isEditMode) return;

    const prefillForm = async () => {
      setIsFetching(true);
      setFetchError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-sanding/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          ukuran_tebal: d.ukuran_tebal ?? '',
          tanggal_produksi: d.tanggal_produksi ?? '',
          group: d.group ?? '',
          grading: d.grading ?? initialState.grading,
          keterangan: d.keterangan ?? '',
          hambatan: Array.isArray(d.hambatan) ? d.hambatan : [],
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };

    prefillForm();
  }, [id, token]);

  // Kalkulasi M3 per grading
  const calculateM3 = (pcs, ukuranTebal) => {
    const p = parseFloat(pcs);
    const t = parseFloat(ukuranTebal);
    if (isNaN(p) || isNaN(t) || p <= 0 || t <= 0) return 0;
    return parseFloat((p * PANJANG * LEBAR * (t / 1000)).toFixed(4));
  };

  // Update grading dengan auto-calculate M3
  const handleGradingChange = (grade, value) => {
    const pcs = value === '' ? '' : value;
    const m3 = calculateM3(pcs, formData.ukuran_tebal);

    setFormData(prev => ({
      ...prev,
      grading: {
        ...prev.grading,
        [grade]: { pcs, m3 },
      },
    }));
  };

  // Recalculate semua M3 saat ukuran tebal berubah
  const handleUkuranTebalChange = (value) => {
    const newTebal = value;
    setFormData(prev => {
      const newGrading = {};
      Object.keys(prev.grading).forEach(grade => {
        const pcs = prev.grading[grade].pcs;
        const m3 = calculateM3(pcs, newTebal);
        newGrading[grade] = { pcs, m3 };
      });

      return {
        ...prev,
        ukuran_tebal: newTebal,
        grading: newGrading,
      };
    });
  };

  // Calculate totals
  const getTotalPcs = () => {
    return Object.values(formData.grading).reduce((sum, g) => {
      const pcs = parseFloat(g.pcs);
      return sum + (isNaN(pcs) ? 0 : pcs);
    }, 0);
  };

  const getTotalM3 = () => {
    return Object.values(formData.grading).reduce((sum, g) => {
      return sum + (g.m3 || 0);
    }, 0).toFixed(4);
  };

  // Hambatan handlers
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

  // Reset form
  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    // Validasi
    if (!formData.ukuran_tebal || !formData.tanggal_produksi || !formData.group) {
      setSubmitError('Ukuran Tebal, Tanggal Produksi, dan Group wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ukuran_tebal: parseFloat(formData.ukuran_tebal),
      tanggal_produksi: formData.tanggal_produksi,
      group: formData.group,
      grading: formData.grading,
      keterangan: formData.keterangan || '',
      hambatan: formData.hambatan,
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-sanding/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-sanding`, payload, {
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
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">
                Laporan Hasil Sanding / Grading MDF
              </h1>
              {isEditMode && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Edit #{id}
                </span>
              )}
            </div>
            {/* Tombol Kembali */}
            <button
              onClick={() => navigate('/sending/dashboard')}
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

        {/* Banner draft */}
        {!isEditMode && hasDraft && !submitSuccess && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
            <span>Disimpan Sebagai Draft.</span>
            <button
              onClick={handleReset}
              className="text-xs font-semibold underline hover:text-amber-900 whitespace-nowrap"
            >
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* General Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Informasi Umum
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ukuran Papan / Tebal (mm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ukuran_tebal}
                  onChange={(e) => handleUkuranTebalChange(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Contoh: 12, 15, 18"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal Produksi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal_produksi}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal_produksi: e.target.value }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Group <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.group}
                  onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                  disabled={isSubmitting}
                  placeholder="Contoh: Group A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Total M3 Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Total M³</span>
                <span className="text-3xl font-bold text-blue-600">
                  {getTotalM3()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Akumulasi dari seluruh grading</p>
            </div>
          </div>

          {/* Tabel Grading */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Data Grading
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">GRADING</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Pcs</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">M³</th>
                  </tr>
                </thead>
                <tbody>
                  {['A', 'B', 'CR', 'SU'].map((grade) => (
                    <tr key={grade} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">Grade {grade}</span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.grading[grade].pcs}
                          onChange={(e) => handleGradingChange(grade, e.target.value)}
                          disabled={isSubmitting}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 min-w-[100px]">
                          {formData.grading[grade].m3.toFixed(4)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                    <td className="py-3 px-4 text-slate-800">TOTAL</td>
                    <td className="py-3 px-4 text-right text-slate-800">
                      {getTotalPcs().toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-sm font-mono text-blue-800 min-w-[100px]">
                        {getTotalM3()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500 mt-3 italic">
              * Rumus: M³ = Pcs × 1.22 × 2.44 × (Tebal / 1000)
            </p>
          </div>

          {/* Keterangan */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Keterangan / Catatan
            </h2>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              disabled={isSubmitting}
              rows="4"
              placeholder="Tambahkan catatan atau informasi khusus terkait proses sanding/grading..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-none"
            />
          </div>

          {/* Tabel Hambatan */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Jam Hambatan
              </h2>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">+</span>
                Tambah Baris
              </button>
            </div>

            {formData.hambatan.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Belum ada hambatan tercatat. Klik "Tambah Baris" untuk menambahkan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 w-1/3">JAM</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">HAMBATAN</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 w-20">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.hambatan.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.jam}
                            onChange={(e) => handleHambatanChange(idx, 'jam', e.target.value)}
                            disabled={isSubmitting}
                            placeholder="08:00 - 09:00"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.hambatan}
                            onChange={(e) => handleHambatanChange(idx, 'hambatan', e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Keterangan hambatan..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            disabled={isSubmitting}
                            className="text-red-500 hover:text-red-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus baris"
                          >
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

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => navigate('/sending/dashboard')}
              className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              ← Kembali ke Dashboard
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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

export default LaporanSanding;
