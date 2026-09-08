import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_kertas_pasir_draft';

const emptyTransaksiRow = () => ({
  merk: '',
  posisi_a: {
    grade_60: '',
    grade_80: '',
    grade_100: '',
    grade_120: '',
    grade_150: '',
    jumlah_papan: '',
  },
  posisi_b: {
    grade_60: '',
    grade_80: '',
    grade_100: '',
    grade_120: '',
    grade_150: '',
    jumlah_papan: '',
  },
});

const initialState = {
  tanggal: new Date().toISOString().split('T')[0],
  transaksi: [],
  keterangan: '',
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
 * LaporanKertasPasir — Form Laporan Pemakaian Kertas Pasir (Sanding)
 * Mode: CREATE dan EDIT
 */
const LaporanKertasPasir = () => {
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

  // Persist draft
  useEffect(() => {
    if (isEditMode) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // Pre-fill mode edit
  useEffect(() => {
    if (!isEditMode) return;

    const prefillForm = async () => {
      setIsFetching(true);
      setFetchError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-kertas-pasir/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          tanggal: d.tanggal ?? '',
          transaksi: Array.isArray(d.transaksi) ? d.transaksi : [],
          keterangan: d.keterangan ?? '',
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };

    prefillForm();
  }, [id, token]);

  // Handlers
  const handleAddTransaksi = () => {
    setFormData(prev => ({
      ...prev,
      transaksi: [...prev.transaksi, emptyTransaksiRow()],
    }));
  };

  const handleDeleteTransaksi = (idx) => {
    setFormData(prev => ({
      ...prev,
      transaksi: prev.transaksi.filter((_, i) => i !== idx),
    }));
  };

  const handleTransaksiChange = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      transaksi: prev.transaksi.map((t, i) => 
        i === idx ? { ...t, [field]: value } : t
      ),
    }));
  };

  const handlePosisiChange = (idx, posisi, field, value) => {
    setFormData(prev => ({
      ...prev,
      transaksi: prev.transaksi.map((t, i) =>
        i === idx
          ? { ...t, [posisi]: { ...t[posisi], [field]: value } }
          : t
      ),
    }));
  };

  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!formData.tanggal) {
      setSubmitError('Tanggal wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      tanggal: formData.tanggal,
      transaksi: formData.transaksi,
      keterangan: formData.keterangan || '',
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-kertas-pasir/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-kertas-pasir`, payload, {
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-800">
              Laporan Pemakaian Kertas Pasir (Sanding)
            </h1>
            {isEditMode && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Edit #{id}
              </span>
            )}
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
          
          {/* Tanggal */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Informasi Umum
            </h2>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Tabel Pemakaian Kertas Pasir */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Tabel Pemakaian Kertas Pasir
              </h2>
              <button
                type="button"
                onClick={handleAddTransaksi}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">+</span>
                Tambah Transaksi
              </button>
            </div>

            {formData.transaksi.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Belum ada data transaksi. Klik "Tambah Transaksi" untuk mulai.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">No</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Merk Kertas Pasir</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Posisi</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Grade 60</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Grade 80</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Grade 100</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Grade 120</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Grade 150</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700">Jumlah Papan</th>
                      <th className="border border-slate-300 py-2 px-3 text-center font-semibold text-slate-700 w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.transaksi.map((transaksi, idx) => (
                      <React.Fragment key={idx}>
                        {/* Baris Posisi A (Atas) */}
                        <tr className="hover:bg-slate-50">
                          <td className="border border-slate-300 py-2 px-3 text-center font-semibold align-middle" rowSpan={2}>
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 py-2 px-3 align-middle" rowSpan={2}>
                            <input
                              type="text"
                              value={transaksi.merk}
                              onChange={(e) => handleTransaksiChange(idx, 'merk', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="Merk..."
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3 text-center bg-blue-50 font-semibold text-blue-700">
                            A
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_a.grade_60}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_a', 'grade_60', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_a.grade_80}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_a', 'grade_80', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_a.grade_100}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_a', 'grade_100', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_a.grade_120}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_a', 'grade_120', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_a.grade_150}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_a', 'grade_150', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_a.jumlah_papan}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_a', 'jumlah_papan', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3 text-center align-middle" rowSpan={2}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaksi(idx)}
                              disabled={isSubmitting}
                              className="text-red-500 hover:text-red-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus transaksi"
                            >
                              ×
                            </button>
                          </td>
                        </tr>

                        {/* Baris Posisi B (Bawah) */}
                        <tr className="hover:bg-slate-50">
                          <td className="border border-slate-300 py-2 px-3 text-center bg-emerald-50 font-semibold text-emerald-700">
                            B
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_b.grade_60}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_b', 'grade_60', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_b.grade_80}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_b', 'grade_80', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_b.grade_100}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_b', 'grade_100', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_b.grade_120}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_b', 'grade_120', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_b.grade_150}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_b', 'grade_150', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-300 py-2 px-3">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={transaksi.posisi_b.jumlah_papan}
                              onChange={(e) => handlePosisiChange(idx, 'posisi_b', 'jumlah_papan', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-3 italic">
              * Setiap transaksi memiliki 2 baris: Posisi A (Atas) dan Posisi B (Bawah)
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
              placeholder="Catatan operasional, pergantian belt sandpaper, dll..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3">
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


export default LaporanKertasPasir;
