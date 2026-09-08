import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL   = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'daily_test_sanding_draft';

// ── Row factories ─────────────────────────────────────────────────────────────

const emptyDensityRow = (no) => ({
  no, weight: '', thickness: '', length: '', width: '',
  dav: '', dmin: '', dmin_davg: '',
});

const emptyPhysicalRow = (no) => ({
  no, mor: '', moe: '', ib: '', sh_face_1: '', sh_face_2: '', surface_absorption: '',
});

const emptyBoardMcRow = (no) => ({
  no, weight_0h: '', weight_24h: '', mc_pct: '',
});

const emptySwellingRow = (no) => ({
  no, weight_0h: '', weight_24h: '', thick_0h: '', thick_24h: '',
  absorption_pct: '', swelling_pct: '',
});

// Sortir Ulang: 4 kolom, tiap kolom: tebal (mm), grading (text), a, b, cr (angka)
const defaultSortirUlang = () => [
  { col: 1, tebal: '', grading: '', a: '', b: '', cr: '' },
  { col: 2, tebal: '', grading: '', a: '', b: '', cr: '' },
  { col: 3, tebal: '', grading: '', a: '', b: '', cr: '' },
  { col: 4, tebal: '', grading: '', a: '', b: '', cr: '' },
];

const make5 = (factory) => Array.from({ length: 5 }, (_, i) => factory(i + 1));

const initialState = {
  date_sanding:    new Date().toISOString().split('T')[0],
  date_production: '',
  shift_group:     '',
  tester:          '',
  shift:           '',
  time:            '',
  board_thickness: '',
  board_density:   make5(emptyDensityRow),
  physical_test:   make5(emptyPhysicalRow),
  board_mc:        make5(emptyBoardMcRow),
  swelling:        make5(emptySwellingRow),
  sortir_ulang:    defaultSortirUlang(),
  remarks:         '',
};

// ── Draft helpers ─────────────────────────────────────────────────────────────

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      ...initialState, ...p,
      board_density: Array.isArray(p.board_density)  ? p.board_density  : make5(emptyDensityRow),
      physical_test: Array.isArray(p.physical_test)  ? p.physical_test  : make5(emptyPhysicalRow),
      board_mc:      Array.isArray(p.board_mc)       ? p.board_mc       : make5(emptyBoardMcRow),
      swelling:      Array.isArray(p.swelling)       ? p.swelling       : make5(emptySwellingRow),
      sortir_ulang:  Array.isArray(p.sortir_ulang)   ? p.sortir_ulang   : defaultSortirUlang(),
    };
  } catch { return null; }
};

// ── Numeric aggregation helpers ───────────────────────────────────────────────

const numVals = (arr, key) =>
  arr.map(r => parseFloat(r[key])).filter(v => !isNaN(v) && isFinite(v));

const safeAvg = (arr, key, dec = 2) => {
  const v = numVals(arr, key);
  return v.length ? (v.reduce((s, x) => s + x, 0) / v.length).toFixed(dec) : '';
};
const safeMax = (arr, key, dec = 2) => {
  const v = numVals(arr, key);
  return v.length ? Math.max(...v).toFixed(dec) : '';
};
const safeMin = (arr, key, dec = 2) => {
  const v = numVals(arr, key);
  return v.length ? Math.min(...v).toFixed(dec) : '';
};

// ── Sortir Ulang calculations ─────────────────────────────────────────────────

// Jumlah per kolom = A + B + CR (aman zero-value: kembalikan '' jika semua 0/kosong)
const calcSortirJumlah = (col) => {
  const a  = parseFloat(col.a)  || 0;
  const b  = parseFloat(col.b)  || 0;
  const cr = parseFloat(col.cr) || 0;
  const total = a + b + cr;
  return total > 0 ? String(total) : '';
};

// Grand total seluruh kolom
const calcSortirTotal = (cols) =>
  cols.reduce((sum, col) => {
    return sum
      + (parseFloat(col.a)  || 0)
      + (parseFloat(col.b)  || 0)
      + (parseFloat(col.cr) || 0);
  }, 0);

// ── Auto-calculations ─────────────────────────────────────────────────────────

// Board MC % = ((W0h - W24h) / W24h) * 100
const calcBoardMC = (w0, w24) => {
  const f0 = parseFloat(w0), f24 = parseFloat(w24);
  if (isNaN(f0) || isNaN(f24) || f24 <= 0) return '';
  return (((f0 - f24) / f24) * 100).toFixed(2);
};

// Water Absorption % = ((W24h - W0h) / W0h) * 100
const calcAbsorption = (w0, w24) => {
  const f0 = parseFloat(w0), f24 = parseFloat(w24);
  if (isNaN(f0) || isNaN(f24) || f0 <= 0) return '';
  return (((f24 - f0) / f0) * 100).toFixed(2);
};

// Thickness Swelling % = ((T24h - T0h) / T0h) * 100
const calcSwelling = (t0, t24) => {
  const f0 = parseFloat(t0), f24 = parseFloat(t24);
  if (isNaN(f0) || isNaN(f24) || f0 <= 0) return '';
  return (((f24 - f0) / f0) * 100).toFixed(2);
};

// ── CSS constants ─────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ' +
  'focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const numCls = 'w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-right ' +
  'focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const textCls = 'w-full px-2 py-1.5 border border-slate-300 rounded text-sm ' +
  'focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const autoCls = 'w-full px-2 py-1.5 border border-purple-300 rounded text-sm text-right ' +
  'font-semibold bg-purple-50 text-purple-800 focus:ring-1 focus:ring-purple-500 disabled:opacity-70';

const thCls = 'text-center py-2.5 px-2 font-semibold text-purple-800 text-xs';

const SectionLabel = ({ letter, title }) => (
  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
      {letter}
    </span>
    {title}
  </h2>
);

// Summary rows (Avg / Max / Min) untuk tabel numerik
const SummaryRows = ({ rows, keys, colsBefore = 1 }) => {
  const funcs = [
    { label: 'Avg', fn: safeAvg },
    { label: 'Max', fn: safeMax },
    { label: 'Min', fn: safeMin },
  ];
  return funcs.map(({ label, fn }) => (
    <tr key={label} className="bg-purple-50 border-t border-purple-200">
      {colsBefore > 0 && (
        <td className="py-2 px-2 text-center text-xs font-bold text-purple-800" colSpan={colsBefore}>
          {label}
        </td>
      )}
      {keys.map(k => (
        <td key={k} className="py-2 px-2 text-center font-mono text-xs font-semibold text-purple-800">
          {fn(rows, k) || <span className="text-purple-300">—</span>}
        </td>
      ))}
    </tr>
  ));
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * LaporanDailyTestSanding — Daily Test Report: SANDING Line MDF
 * Mode: CREATE dan EDIT
 */
const LaporanDailyTestSanding = () => {
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

  const submitStatusRef = useRef(null);

  // Persist draft
  useEffect(() => {
    if (isEditMode) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // Pre-fill edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const res = await axios.get(`${API_URL}/laporan-daily-test/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          date_sanding:    d.date_sanding    ?? '',
          date_production: d.date_production ?? '',
          shift_group:     d.shift_group     ?? '',
          tester:          d.tester          ?? '',
          shift:           d.shift           ?? '',
          time:            d.time            ?? '',
          board_thickness: d.board_thickness ?? '',
          board_density:   Array.isArray(d.board_density)  ? d.board_density  : make5(emptyDensityRow),
          physical_test:   Array.isArray(d.physical_test)  ? d.physical_test  : make5(emptyPhysicalRow),
          board_mc:        Array.isArray(d.board_mc)       ? d.board_mc       : make5(emptyBoardMcRow),
          swelling:        Array.isArray(d.swelling)       ? d.swelling       : make5(emptySwellingRow),
          sortir_ulang:    Array.isArray(d.sortir_ulang)   ? d.sortir_ulang   : defaultSortirUlang(),
          remarks:         d.remarks ?? '',
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id, token]);

  // ── Field handlers ────────────────────────────────────────────────────────

  const setField = (key, val) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  // Board Density
  const handleDensityChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      board_density: prev.board_density.map((r, i) =>
        i === idx ? { ...r, [key]: val } : r
      ),
    }));

  // Physical Test
  const handlePhysicalChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      physical_test: prev.physical_test.map((r, i) =>
        i === idx ? { ...r, [key]: val } : r
      ),
    }));

  // Board MC — auto-calc mc_pct
  const handleBoardMcChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      board_mc: prev.board_mc.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [key]: val };
        const w0  = key === 'weight_0h'  ? val : updated.weight_0h;
        const w24 = key === 'weight_24h' ? val : updated.weight_24h;
        updated.mc_pct = calcBoardMC(w0, w24);
        return updated;
      }),
    }));

  // Swelling — auto-calc absorption_pct & swelling_pct
  const handleSwellingChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      swelling: prev.swelling.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [key]: val };
        if (['weight_0h','weight_24h'].includes(key)) {
          updated.absorption_pct = calcAbsorption(
            key === 'weight_0h'  ? val : updated.weight_0h,
            key === 'weight_24h' ? val : updated.weight_24h,
          );
        }
        if (['thick_0h','thick_24h'].includes(key)) {
          updated.swelling_pct = calcSwelling(
            key === 'thick_0h'  ? val : updated.thick_0h,
            key === 'thick_24h' ? val : updated.thick_24h,
          );
        }
        return updated;
      }),
    }));

  // Sortir Ulang — update satu cell (colIdx, key)
  const handleSortirChange = (colIdx, key, val) =>
    setFormData(prev => ({
      ...prev,
      sortir_ulang: prev.sortir_ulang.map((c, i) =>
        i === colIdx ? { ...c, [key]: val } : c
      ),
    }));

  // ── Reset ─────────────────────────────────────────────────────────────────

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

    if (!formData.date_sanding) {
      setSubmitError('Date of Sanding wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    // Payload lengkap — sortir_ulang ikut serta
    const payload = { ...formData };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-daily-test/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Daily Test Report #${id} berhasil diupdate.`);
      } else {
        const res = await axios.post(`${API_URL}/laporan-daily-test`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Daily Test Report #${res.data.id} berhasil disimpan.`);
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

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-0.5">
                PT CANANG INDAH INDUSTRI — MDF
              </p>
              <h1 className="text-2xl font-bold text-slate-800">Daily Test Report</h1>
              <p className="text-sm text-slate-500 mt-0.5">SANDING LINE MDF</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase">
                  Edit #{id}
                </span>
              )}
              <button type="button" onClick={() => navigate('/sending/dashboard')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>

        {/* ── Alerts ── */}
        {!isEditMode && hasDraft && !submitSuccess && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
            <span>📋 Draft tersimpan secara otomatis.</span>
            <button onClick={handleReset} className="text-xs font-semibold underline hover:text-amber-900">Hapus Draft</button>
          </div>
        )}
        {fetchError    && <div className="mb-4 bg-red-50   border border-red-200   text-red-700   text-sm rounded-lg px-4 py-3">❌ {fetchError}</div>}
        {submitSuccess && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">✅ {submitSuccess}</div>}
        {submitError   && <div className="mb-4 bg-red-50   border border-red-200   text-red-700   text-sm rounded-lg px-4 py-3">❌ {submitError}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── A. Informasi Laporan ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="A" title="Informasi Laporan" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { key: 'date_sanding',    label: 'Date of Sanding *', type: 'date' },
                { key: 'date_production', label: 'Date of Production', type: 'date' },
                { key: 'shift_group',     label: 'Shift / Group',      type: 'text' },
                { key: 'tester',          label: 'Tester',             type: 'text' },
                { key: 'shift',           label: 'Shift',              type: 'text' },
                { key: 'time',            label: 'Time',               type: 'time' },
                { key: 'board_thickness', label: 'Board Thickness',    type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input type={type} value={formData[key]}
                    onChange={e => setField(key, e.target.value)}
                    disabled={isSubmitting}
                    className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* ── B. Board Density ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="B" title="Board Density" />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-purple-50 border-b-2 border-purple-200">
                    {['No','Weight (gr)','Thickness (mm)','Length (mm)','Width (mm)',
                      'Dav [kg/m³]','Dmin [kg/m³]','Dmin/Davg'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.board_density.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium">{row.no}</td>
                      {['weight','thickness','length','width','dav','dmin','dmin_davg'].map(k => (
                        <td key={k} className="py-1 px-1 min-w-[80px]">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handleDensityChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <SummaryRows
                    rows={formData.board_density}
                    keys={['weight','thickness','length','width','dav','dmin','dmin_davg']}
                    colsBefore={1}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* ── C. Physical Test & D. Board MC berdampingan ── */}
          <div className="flex flex-col xl:flex-row gap-5 mb-5">

            {/* Physical Test with ZWICK Z010 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-[3] min-w-0">
              <SectionLabel letter="C" title="Physical Test with ZWICK Z010 & Surface Absorption" />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-purple-50 border-b-2 border-purple-200">
                      {['No','MOR [N/mm²]','MOE [N/mm²]','IB [N/mm²]',
                        'SH Face [N]','SH Face [N]','Surface Absorption'].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.physical_test.map((row, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium">{row.no}</td>
                        {['mor','moe','ib','sh_face_1','sh_face_2','surface_absorption'].map(k => (
                          <td key={k} className="py-1 px-1 min-w-[70px]">
                            <input type="number" step="any" value={row[k]}
                              onChange={e => handlePhysicalChange(i, k, e.target.value)}
                              disabled={isSubmitting} className={numCls} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <SummaryRows
                      rows={formData.physical_test}
                      keys={['mor','moe','ib','sh_face_1','sh_face_2','surface_absorption']}
                      colsBefore={1}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Board MC */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 min-w-0">
              <SectionLabel letter="D" title="Board MC : Oven (24h, 120°C)" />
              <div className="mb-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                📐 MC % = ((W.0h − W.24h) / W.24h) × 100
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[260px]">
                  <thead>
                    <tr className="bg-purple-50 border-b-2 border-purple-200">
                      {['No','W.0h (gr)','W.24h (gr)','MC % (auto)'].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.board_mc.map((row, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium">{row.no}</td>
                        <td className="py-1 px-1">
                          <input type="number" step="any" value={row.weight_0h}
                            onChange={e => handleBoardMcChange(i, 'weight_0h', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                        <td className="py-1 px-1">
                          <input type="number" step="any" value={row.weight_24h}
                            onChange={e => handleBoardMcChange(i, 'weight_24h', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                        <td className="py-1 px-1">
                          <input type="text" readOnly tabIndex={-1}
                            value={row.mc_pct ? `${row.mc_pct}%` : ''}
                            className={autoCls} />
                        </td>
                      </tr>
                    ))}
                    <SummaryRows
                      rows={formData.board_mc}
                      keys={['weight_0h','weight_24h','mc_pct']}
                      colsBefore={1}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── E. Swelling & Absorption ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="E" title="Swelling and Absorption in Water (20°C ± 2°C), 24h" />
            <div className="mb-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              📐 Absorption % = ((W.24h − W.0h) / W.0h) × 100 &nbsp;|&nbsp;
              Swelling % = ((T.24h − T.0h) / T.0h) × 100
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-purple-50 border-b-2 border-purple-200">
                    {['No','W.0h (gr)','W.24h (gr)','Thick 0h (mm)','Thick 24h (mm)',
                      'Absorption 24h % (auto)','Swelling 24h % (auto)'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.swelling.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium">{row.no}</td>
                      {['weight_0h','weight_24h','thick_0h','thick_24h'].map(k => (
                        <td key={k} className="py-1 px-1 min-w-[75px]">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handleSwellingChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                      <td className="py-1 px-1 min-w-[80px]">
                        <input type="text" readOnly tabIndex={-1}
                          value={row.absorption_pct ? `${row.absorption_pct}%` : ''}
                          className={autoCls} />
                      </td>
                      <td className="py-1 px-1 min-w-[80px]">
                        <input type="text" readOnly tabIndex={-1}
                          value={row.swelling_pct ? `${row.swelling_pct}%` : ''}
                          className={autoCls} />
                      </td>
                    </tr>
                  ))}
                  <SummaryRows
                    rows={formData.swelling}
                    keys={['weight_0h','weight_24h','thick_0h','thick_24h','absorption_pct','swelling_pct']}
                    colsBefore={1}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* ── F. Sortir Ulang ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="F" title="Sortir Ulang" />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-purple-50 border-b-2 border-purple-200">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-purple-800 w-28">
                      Kategori
                    </th>
                    {formData.sortir_ulang.map((_, ci) => (
                      <th key={ci} className={thCls}>Kolom {ci + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>

                  {/* Baris Tebal (mm) */}
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-600">Tebal (mm)</td>
                    {formData.sortir_ulang.map((col, ci) => (
                      <td key={ci} className="py-1.5 px-1">
                        <input
                          type="number" step="any" value={col.tebal}
                          onChange={e => handleSortirChange(ci, 'tebal', e.target.value)}
                          disabled={isSubmitting}
                          className={numCls}
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Baris Grading */}
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-600">Grading</td>
                    {formData.sortir_ulang.map((col, ci) => (
                      <td key={ci} className="py-1.5 px-1">
                        <input
                          type="text" value={col.grading}
                          onChange={e => handleSortirChange(ci, 'grading', e.target.value)}
                          disabled={isSubmitting}
                          className={textCls}
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Baris A, B, CR */}
                  {[
                    { key: 'a',  label: 'A'  },
                    { key: 'b',  label: 'B'  },
                    { key: 'cr', label: 'CR' },
                  ].map(({ key, label }) => (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-xs font-semibold text-slate-700">{label}</td>
                      {formData.sortir_ulang.map((col, ci) => (
                        <td key={ci} className="py-1.5 px-1">
                          <input
                            type="number" step="1" min="0" value={col[key]}
                            onChange={e => handleSortirChange(ci, key, e.target.value)}
                            disabled={isSubmitting}
                            className={numCls}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Baris Jumlah per kolom — auto (A + B + CR) */}
                  <tr className="border-b border-purple-200 bg-purple-50/60">
                    <td className="py-2 px-3 text-xs font-semibold text-purple-800">Jumlah</td>
                    {formData.sortir_ulang.map((col, ci) => (
                      <td key={ci} className="py-2 px-2 text-center">
                        <span className="font-mono font-semibold text-sm text-purple-800">
                          {calcSortirJumlah(col) || <span className="text-purple-300">—</span>}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Baris Total grand — auto */}
                  <tr className="bg-purple-50 border-t-2 border-purple-200">
                    <td className="py-2.5 px-3 text-xs font-bold text-purple-800">Total</td>
                    <td
                      colSpan={formData.sortir_ulang.length}
                      className="py-2.5 px-3 text-center"
                    >
                      {(() => {
                        const t = calcSortirTotal(formData.sortir_ulang);
                        return t > 0
                          ? <span className="font-mono font-bold text-base text-purple-800">{t}</span>
                          : <span className="text-purple-300 font-normal">—</span>;
                      })()}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* ── G. Remarks ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="G" title="Remarks" />
            <textarea
              value={formData.remarks}
              onChange={e => setField('remarks', e.target.value)}
              disabled={isSubmitting}
              rows={4}
              placeholder="Catatan pengujian, kondisi khusus, atau informasi tambahan..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                         disabled:bg-slate-50 resize-none"
            />
          </div>

          {/* ── Action Bar ── */}
          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
            <button type="button" onClick={() => navigate('/sending/dashboard')}
              className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
              ← Kembali ke Dashboard
            </button>

            <div className="flex gap-3 flex-wrap">
              <button type="button" onClick={handleReset} disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Reset Form
              </button>

              <button type="button" disabled={isSubmitting}
                onClick={e => { submitStatusRef.current = 'draft'; handleSubmit(e); }}
                className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                💾 Simpan Draft
              </button>

              <SubmitButton
                isSubmitting={isSubmitting}
                label={isEditMode ? 'Simpan Perubahan' : '📤 Simpan / Submit Report'}
                loadingLabel="Menyimpan..."
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              />
            </div>
          </div>

        </form>
      </main>
    </div>
  );
};

export default LaporanDailyTestSanding;
