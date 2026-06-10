import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TabelImal from '../components/laporan-imal/TabelImal';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL   = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'laporan_imal_draft';

// ── 3 sub-baris per shift-block ────────────────────────────────
const emptyRows = () => [
  { keterangan: 'Awal',  material: '', glue: '', wax: '' },
  { keterangan: 'Pakai', material: '', glue: '', wax: '' },
  { keterangan: 'Akhir', material: '', glue: '', wax: '' },
];

// ── Template 1 shift-block kosong ─────────────────────────────
const emptyShiftBlock = (operatorName = '') => ({
  shift:               '',
  rows:                emptyRows(),   // 3 baris independen
  dilaporkan_operator: operatorName,
  diperiksa_status:    'pending',
  diperiksa_oleh:      '',
  diperiksa_at:        '',
});

const initialState = { shifts: [] };

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validasi schema: harus punya shifts array, dan tiap block harus punya rows array
    // Jika schema lama (tidak punya rows), buang draft dan mulai bersih
    if (!Array.isArray(parsed?.shifts)) return null;
    const isValidSchema = parsed.shifts.every(
      block => Array.isArray(block.rows) && block.rows.length === 3
    );
    if (!isValidSchema) {
      localStorage.removeItem(DRAFT_KEY); // buang draft schema lama
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const LaporanImal = () => {
  const { id }     = useParams();
  const isEditMode = Boolean(id);
  const { token, user } = useAuth();
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

  // ── Persist draft ──────────────────────────────────────────────
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
        const res = await axios.get(`${API_URL}/laporan-imal/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        // Pastikan setiap block punya rows (backward-compat data lama)
        const shifts = (Array.isArray(d.shifts) ? d.shifts : []).map(block => ({
          ...block,
          rows: Array.isArray(block.rows) && block.rows.length === 3
            ? block.rows
            : emptyRows(),
        }));
        setFormData({ shifts });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };
    prefill();
  }, [id]);

  // ── Handler perubahan sub-baris (material / glue / wax) ───────
  // blockIdx = index shift-block, rowIdx = 0/1/2 (Awal/Pakai/Akhir)
  const handleRowChange = (blockIdx, rowIdx, key, value) => {
    setFormData(prev => ({
      shifts: prev.shifts.map((block, bi) => {
        if (bi !== blockIdx) return block;
        return {
          ...block,
          rows: block.rows.map((row, ri) =>
            ri === rowIdx ? { ...row, [key]: value } : row
          ),
        };
      }),
    }));
  };

  // ── Handler perubahan field di level shift-block (shift) ───────
  const handleShiftChange = (blockIdx, key, value) => {
    setFormData(prev => ({
      shifts: prev.shifts.map((block, bi) =>
        bi !== blockIdx ? block : { ...block, [key]: value }
      ),
    }));
  };

  const handleAddShift = () => {
    setFormData(prev => ({
      shifts: [...prev.shifts, emptyShiftBlock(user?.name)],
    }));
  };

  const handleDeleteShift = (i) => {
    setFormData(prev => ({
      shifts: prev.shifts.filter((_, idx) => idx !== i),
    }));
  };

  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); }
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true); // set true sebelum hit API

    // Pastikan dilaporkan_operator terisi sebelum kirim
    const shiftsPayload = formData.shifts.map(block => ({
      ...block,
      dilaporkan_operator: block.dilaporkan_operator || user?.name || '',
    }));

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-imal/${id}`,
          { shifts: shiftsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmitSuccess(`Laporan IMAL #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-imal`,
          { shifts: shiftsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmitSuccess(`Laporan IMAL #${res.data.id} berhasil disimpan.`);
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

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Judul ── */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                Pemakaian Bahan Baku / Shift (IMAL)
              </h1>
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
            <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700">
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
            <TabelImal
              shifts={formData.shifts}
              onChange={handleRowChange}
              onShiftChange={handleShiftChange}
              onAddShift={handleAddShift}
              onDeleteShift={handleDeleteShift}
              currentUser={user}
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

export default LaporanImal;
