import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import SubmitButton from '../components/ui/SubmitButton';

const API_URL  = `http://${window.location.hostname}:5000/api`;
const DRAFT_KEY = 'qclab_shift_report_draft';

// ── Row factories ─────────────────────────────────────────────────────────────

const emptyMoistureRow = (nomor) => ({
  nomor, container_weight: '', wet_chips_weight: '', cont_dry_chips: '',
  moisture_content: '', ph: '',
});

const emptyBulkRow = (nomor) => ({
  nomor, wet_chips_weight: '', bulk_density_wet: '', bulk_density_dry: '', species_of_wood: '',
});

const defaultGlueMix = () => ({
  time_in: '', time_out: '',
  samples: [
    { no: 1, foil_weight: '', gluemix_weight: '', foil_dry_glue: '', solid_content: '', remark: '' },
    { no: 2, foil_weight: '', gluemix_weight: '', foil_dry_glue: '', solid_content: '', remark: '' },
    { no: 3, foil_weight: '', gluemix_weight: '', foil_dry_glue: '', solid_content: '', remark: '' },
  ],
  solid_content_avg: '',
  viscosity: '', temp: '', density: '', ph: '',
});

const emptyHardenerRow = (nomor) => ({
  nomor, time: '', hardener_pct: '', wax_pct: '', dynasteam_atas: '', dynasteam_bawah: '',
});

// ── Section 5: Screen Test & MC Fiber ────────────────────────────────────────

const defaultScreenTest = () => ({
  time_sampling:      '',
  discharge_screw:    '',
  blowline_opening:   '',
  steam_flow:         '',
  refiner_load:       '',
  digester_level:     '',
  digester_pressure:  '',
  refiner_level:      '',
  cooking_level:      '',
  mc_quadra_beam:     '',
  mc_test_lab_qc:     '',
  // mesh rows: fixed 5 rows, weight_sample editable, weight_dist auto
  mesh_rows: [
    { mesh_size: '> 1.0 mm',   weight_sample: '', weight_dist: '', spec: '≤ 6 %' },
    { mesh_size: '> 0.5 mm',   weight_sample: '', weight_dist: '', spec: '9 - 17 %' },
    { mesh_size: '> 0.25 mm',  weight_sample: '', weight_dist: '', spec: '11 - 20 %' },
    { mesh_size: '> 0.125 mm', weight_sample: '', weight_dist: '', spec: '16 - 34 %' },
    { mesh_size: '< 0.125 mm', weight_sample: '', weight_dist: '', spec: '33 - 55 %' },
  ],
});

// ── Section 6: Thickness and Density Distribution ────────────────────────────

const emptyThickDensRow = (nomor) => ({
  nomor, time_sampling: '', od_glue: '', fibre_mc: '', set_weight: '',
  target_density: '', avg_density: '', target_thick: '',
  min_thick: '', max_thick: '', avg_thick: '', length_board: '', width_board: '',
});

// ── Section 7: Press & Process Parameters ────────────────────────────────────

const emptyPressRow = (nomor) => ({
  nomor,
  temp_inlet_press: '',
  speed_press: '',
  max_density: '', min_core_density: '', ratio_dens: '',
  ib_average: '', ib_minimum: '',
  heating_1: '', heating_2: '', heating_3: '', heating_4: '',
});

// ── Section 8: Board MC, Physical Test, Swelling ─────────────────────────────

const emptyBoardMcRow = (no) => ({
  no,
  weight_before: '', weight_after: '', mc_pct: '',
  // Physical Test per-baris (sejajar dengan board_mc di tabel horizontal)
  sh_face: '', sh_edge: '',
});

const emptySwellingRow = (no) => ({
  no,
  weight_0h: '', thick_0h: '',
  weight_24h: '', thick_24h: '',
  absorption_pct: '', swelling_pct: '',
});

const defaultSection8 = () => ({
  board_mc:    Array.from({ length: 5 }, (_, i) => emptyBoardMcRow(i + 1)),
  geltime:     '',          // Physical Test — Geltime (1 cell merged, bukan per-baris)
  swelling_jam: '',         // Input jam kondisi pengujian swelling
  swelling:    Array.from({ length: 5 }, (_, i) => emptySwellingRow(i + 1)),
  emission_jis:  '',
  emission_astm: '',
  // Modulus of Rupture: 5 baris, 2 kolom (moe, mor)
  mor_moe: Array.from({ length: 5 }, (_, i) => ({ no: i + 1, moe: '', mor: '' })),
  // Surface Soundness: 3 sample + avg auto
  surface_soundness: [
    { no: 1, value: '' },
    { no: 2, value: '' },
    { no: 3, value: '' },
  ],
});

const initialState = {
  tanggal: new Date().toISOString().split('T')[0],
  shift_group: '', nik_nama_1: '', nik_nama_2: '',
  kondisi_lampu: 'OK', lokasi_kerja: 'Bersih', status: 'draft',
  chips_moisture:     [emptyMoistureRow(1), emptyMoistureRow(2), emptyMoistureRow(3)],
  chips_bulk_density: [emptyBulkRow(1), emptyBulkRow(2)],
  glue_mix:           defaultGlueMix(),
  hardener_wax:       [emptyHardenerRow(1), emptyHardenerRow(2)],
  screen_test:        defaultScreenTest(),
  thick_density:      [emptyThickDensRow(1), emptyThickDensRow(2)],
  press_params:       [emptyPressRow(1), emptyPressRow(2)],
  section8:           defaultSection8(),
};

// ── Draft helpers ─────────────────────────────────────────────────────────────

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Guard: pastikan semua field array ada (schema lama tidak punya hardener_wax)
    return {
      ...initialState,
      ...parsed,
      chips_moisture:     Array.isArray(parsed.chips_moisture)     ? parsed.chips_moisture     : initialState.chips_moisture,
      chips_bulk_density: Array.isArray(parsed.chips_bulk_density) ? parsed.chips_bulk_density : initialState.chips_bulk_density,
      glue_mix:           (parsed.glue_mix && typeof parsed.glue_mix === 'object') ? { ...defaultGlueMix(), ...parsed.glue_mix } : defaultGlueMix(),
      hardener_wax:       Array.isArray(parsed.hardener_wax)       ? parsed.hardener_wax       : initialState.hardener_wax,
      screen_test:        (parsed.screen_test && typeof parsed.screen_test === 'object') ? { ...defaultScreenTest(), ...parsed.screen_test } : defaultScreenTest(),
      thick_density:      Array.isArray(parsed.thick_density)      ? parsed.thick_density      : initialState.thick_density,
      press_params:       Array.isArray(parsed.press_params)       ? parsed.press_params       : initialState.press_params,
      section8:           (parsed.section8 && typeof parsed.section8 === 'object')   ? { ...defaultSection8(), ...parsed.section8 }   : defaultSection8(),
    };
  } catch { return null; }
};

// ── Calculations ──────────────────────────────────────────────────────────────

// Chips Moisture Content (%)
// Rumus: MC (%) = [b - (c - a)] / (c - a) × 100
//   a = Container Weight  (berat kontainer kosong)
//   b = Wet Chips Weight  (berat kontainer + chips basah)
//   c = Cont + Dry Chips  (berat kontainer + chips kering)
//
// Langkah:
//   1. dryWeight  = c - a              (berat chips kering saja)
//   2. waterWeight = b - dryWeight     (= b - (c - a), berat air)
//   3. mc         = (waterWeight / dryWeight) × 100
//
// Edge cases:
//   • Salah satu field kosong/NaN → return ''
//   • dryWeight === 0 (c === a)   → return '0.00' (hindari Infinity)
//   • dryWeight < 0 (c < a)      → return '' (data tidak valid secara fisik)
const calcMC = (a, b, c) => {
  const fa = parseFloat(a), fb = parseFloat(b), fc = parseFloat(c);

  // Belum semua field terisi
  if (isNaN(fa) || isNaN(fb) || isNaN(fc)) return '';

  const dryWeight  = fc - fa;           // step 1: c - a
  const waterWeight = fb - dryWeight;   // step 2: b - (c - a)

  // c < a: data fisik tidak masuk akal → kosongkan
  if (dryWeight < 0) return '';

  // c === a: pembagian dengan nol → return '0.00'
  if (dryWeight === 0) return '0.00';

  const mc = (waterWeight / dryWeight) * 100;   // step 3

  // Nilai negatif atau tidak finite (seharusnya tidak terjadi setelah guard di atas)
  if (!isFinite(mc) || isNaN(mc)) return '';

  return mc.toFixed(2);
};

const calcSC = (a, b, c) => {
  const fa = parseFloat(a), fb = parseFloat(b), fc = parseFloat(c);
  if (isNaN(fa) || isNaN(fb) || isNaN(fc) || fb <= 0) return '';
  const sc = ((fc - fa) / fb) * 100;
  return isNaN(sc) ? '' : sc.toFixed(2);
};

const calcAvg = (samples) => {
  const vals = samples.map(s => parseFloat(s.solid_content)).filter(v => !isNaN(v));
  return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : '';
};

// Weight Distribution % = (weight_sample / total_sample) * 100
const calcWeightDist = (meshRows) =>
  meshRows.map(r => {
    const total = meshRows.reduce((s, x) => s + (parseFloat(x.weight_sample) || 0), 0);
    const w = parseFloat(r.weight_sample);
    const pct = (!isNaN(w) && total > 0) ? ((w / total) * 100).toFixed(2) : '';
    return { ...r, weight_dist: pct };
  });

// Board MC % = ((weight_before - weight_after) / weight_after) * 100
const calcBoardMC = (before, after) => {
  const fb = parseFloat(before), fa = parseFloat(after);
  if (isNaN(fb) || isNaN(fa) || fa <= 0) return '';
  return (((fb - fa) / fa) * 100).toFixed(2);
};

// Absorption % = ((weight_24h - weight_0h) / weight_0h) * 100
const calcAbsorption = (w0, w24) => {
  const f0 = parseFloat(w0), f24 = parseFloat(w24);
  if (isNaN(f0) || isNaN(f24) || f0 <= 0) return '';
  return (((f24 - f0) / f0) * 100).toFixed(2);
};

// Swelling % = ((thick_24h - thick_0h) / thick_0h) * 100
const calcSwelling = (t0, t24) => {
  const f0 = parseFloat(t0), f24 = parseFloat(t24);
  if (isNaN(f0) || isNaN(f24) || f0 <= 0) return '';
  return (((f24 - f0) / f0) * 100).toFixed(2);
};

const avgOf = (arr, key) => {
  const vals = arr.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
  return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : '';
};

// ASTM D 6007 (ppm) = JIS A 1460 (mg/l) / 7.214
const calcAstm = (jisVal) => {
  const n = parseFloat(jisVal);
  if (!jisVal || isNaN(n) || n <= 0) return '';
  return (n / 7.214).toFixed(3);
};

// Surface Soundness avg
const calcSurfaceAvg = (rows) => {
  const vals = rows.map(r => parseFloat(r.value)).filter(v => !isNaN(v));
  return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3) : '';
};

// ── CSS constants ─────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400';
const numCls   = 'w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400';
const autoCls  = 'w-full px-2 py-1.5 border border-teal-300 rounded text-sm text-right font-semibold bg-teal-50 text-teal-800 focus:ring-1 focus:ring-teal-500 disabled:opacity-70';
const thCls    = 'text-center py-2.5 px-2 font-semibold text-teal-800 text-xs';

const SectionLabel = ({ letter, title }) => (
  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
      {letter}
    </span>
    {title}
  </h2>
);

// ─────────────────────────────────────────────────────────────────────────────

const LaporanQcLabShiftReport = () => {
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

  // Bersihkan draft lama yang mungkin corrupt (schema lama tanpa hardener_wax)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.hardener_wax) || !parsed.glue_mix?.samples) {
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft to localStorage (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, isEditMode]);

  // Pre-fill in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchData = async () => {
      setIsFetching(true);
      setFetchError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-qclab-shift/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.laporan;
        setFormData({
          tanggal:       d.tanggal       ?? '',
          shift_group:   d.shift_group   ?? '',
          nik_nama_1:    d.nik_nama_1    ?? '',
          nik_nama_2:    d.nik_nama_2    ?? '',
          kondisi_lampu: d.kondisi_lampu ?? 'OK',
          lokasi_kerja:  d.lokasi_kerja  ?? 'Bersih',
          status:        d.status        ?? 'draft',
          chips_moisture:     Array.isArray(d.chips_moisture)     ? d.chips_moisture     : initialState.chips_moisture,
          chips_bulk_density: Array.isArray(d.chips_bulk_density) ? d.chips_bulk_density : initialState.chips_bulk_density,
          glue_mix:           (d.glue_mix && typeof d.glue_mix === 'object') ? d.glue_mix : defaultGlueMix(),
          hardener_wax:       Array.isArray(d.hardener_wax)       ? d.hardener_wax       : initialState.hardener_wax,
          screen_test:        (d.screen_test && typeof d.screen_test === 'object') ? { ...defaultScreenTest(), ...d.screen_test } : defaultScreenTest(),
          thick_density:      Array.isArray(d.thick_density)      ? d.thick_density      : initialState.thick_density,
          press_params:       Array.isArray(d.press_params)       ? d.press_params       : initialState.press_params,
          section8:           (d.section8 && typeof d.section8 === 'object') ? { ...defaultSection8(), ...d.section8 } : defaultSection8(),
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id, token]);

  // ── Field handlers ─────────────────────────────────────────────────────────

  const setField = (key, val) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  // Chips Moisture
  const handleMoistureChange = (idx, key, val) => {
    setFormData(prev => {
      const rows = prev.chips_moisture.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [key]: val };
        if (['container_weight', 'wet_chips_weight', 'cont_dry_chips'].includes(key)) {
          const a = key === 'container_weight' ? val : updated.container_weight;
          const b = key === 'wet_chips_weight'  ? val : updated.wet_chips_weight;
          const c = key === 'cont_dry_chips'    ? val : updated.cont_dry_chips;
          updated.moisture_content = calcMC(a, b, c);
        }
        return updated;
      });
      return { ...prev, chips_moisture: rows };
    });
  };

  const handleAddMoistureRow = () =>
    setFormData(prev => ({
      ...prev,
      chips_moisture: [...prev.chips_moisture, emptyMoistureRow(prev.chips_moisture.length + 1)],
    }));

  const handleDeleteMoistureRow = (idx) =>
    setFormData(prev => ({
      ...prev,
      chips_moisture: prev.chips_moisture
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, nomor: i + 1 })),
    }));

  // Chips Bulk Density
  const handleBulkChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      chips_bulk_density: prev.chips_bulk_density.map((row, i) =>
        i === idx ? { ...row, [key]: val } : row
      ),
    }));

  const handleAddBulkRow = () =>
    setFormData(prev => ({
      ...prev,
      chips_bulk_density: [...prev.chips_bulk_density, emptyBulkRow(prev.chips_bulk_density.length + 1)],
    }));

  const handleDeleteBulkRow = (idx) =>
    setFormData(prev => ({
      ...prev,
      chips_bulk_density: prev.chips_bulk_density
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, nomor: i + 1 })),
    }));

  // Glue Mix — top-level fields
  const handleGlueField = (key, val) =>
    setFormData(prev => ({
      ...prev,
      glue_mix: { ...prev.glue_mix, [key]: val },
    }));

  // Glue Mix — sample rows
  const handleGlueSampleChange = (idx, key, val) => {
    setFormData(prev => {
      const samples = prev.glue_mix.samples.map((s, i) => {
        if (i !== idx) return s;
        const updated = { ...s, [key]: val };
        if (['foil_weight', 'gluemix_weight', 'foil_dry_glue'].includes(key)) {
          const a = key === 'foil_weight'    ? val : updated.foil_weight;
          const b = key === 'gluemix_weight' ? val : updated.gluemix_weight;
          const c = key === 'foil_dry_glue'  ? val : updated.foil_dry_glue;
          updated.solid_content = calcSC(a, b, c);
        }
        return updated;
      });
      return {
        ...prev,
        glue_mix: { ...prev.glue_mix, samples, solid_content_avg: calcAvg(samples) },
      };
    });
  };

  // Glue Mix — tambah baris In baru
  const handleAddGlueSampleRow = () =>
    setFormData(prev => {
      const samples = [
        ...prev.glue_mix.samples,
        {
          no: prev.glue_mix.samples.length + 1,
          foil_weight: '', gluemix_weight: '', foil_dry_glue: '',
          solid_content: '', remark: '',
        },
      ];
      return { ...prev, glue_mix: { ...prev.glue_mix, samples } };
    });

  // Glue Mix — hapus baris (minimum 1 baris)
  const handleDeleteGlueSampleRow = (idx) =>
    setFormData(prev => {
      if (prev.glue_mix.samples.length <= 1) return prev;
      const samples = prev.glue_mix.samples
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, no: i + 1 }));
      return {
        ...prev,
        glue_mix: { ...prev.glue_mix, samples, solid_content_avg: calcAvg(samples) },
      };
    });

  // Hardener, Wax & Dynasteam
  const handleHardenerChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      hardener_wax: prev.hardener_wax.map((row, i) =>
        i === idx ? { ...row, [key]: val } : row
      ),
    }));

  const handleAddHardenerRow = () =>
    setFormData(prev => ({
      ...prev,
      hardener_wax: [...prev.hardener_wax, emptyHardenerRow(prev.hardener_wax.length + 1)],
    }));

  const handleDeleteHardenerRow = (idx) =>
    setFormData(prev => ({
      ...prev,
      hardener_wax: prev.hardener_wax
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, nomor: i + 1 })),
    }));

  // ── Section 5: Screen Test ─────────────────────────────────────────────────

  const handleScreenField = (key, val) =>
    setFormData(prev => ({ ...prev, screen_test: { ...prev.screen_test, [key]: val } }));

  const handleMeshChange = (idx, val) => {
    setFormData(prev => {
      const updated = prev.screen_test.mesh_rows.map((r, i) =>
        i === idx ? { ...r, weight_sample: val } : r
      );
      return {
        ...prev,
        screen_test: { ...prev.screen_test, mesh_rows: calcWeightDist(updated) },
      };
    });
  };

  // ── Section 6: Thickness & Density ────────────────────────────────────────

  const handleThickDensChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      thick_density: prev.thick_density.map((r, i) =>
        i === idx ? { ...r, [key]: val } : r
      ),
    }));

  const handleAddThickDensRow = () =>
    setFormData(prev => ({
      ...prev,
      thick_density: [...prev.thick_density, emptyThickDensRow(prev.thick_density.length + 1)],
    }));

  const handleDeleteThickDensRow = (idx) =>
    setFormData(prev => ({
      ...prev,
      thick_density: prev.thick_density
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, nomor: i + 1 })),
    }));

  // ── Section 7: Press Params ────────────────────────────────────────────────

  const handlePressChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      press_params: prev.press_params.map((r, i) =>
        i === idx ? { ...r, [key]: val } : r
      ),
    }));

  const handleAddPressRow = () =>
    setFormData(prev => ({
      ...prev,
      press_params: [...prev.press_params, emptyPressRow(prev.press_params.length + 1)],
    }));

  const handleDeletePressRow = (idx) =>
    setFormData(prev => ({
      ...prev,
      press_params: prev.press_params
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, nomor: i + 1 })),
    }));

  // ── Section 8: Board MC, Physical Test, Swelling ──────────────────────────

  const handleBoardMcChange = (idx, key, val) => {
    setFormData(prev => {
      const rows = prev.section8.board_mc.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [key]: val };
        if (key === 'weight_before' || key === 'weight_after') {
          const b = key === 'weight_before' ? val : updated.weight_before;
          const a = key === 'weight_after'  ? val : updated.weight_after;
          updated.mc_pct = calcBoardMC(b, a);
        }
        return updated;
      });
      return { ...prev, section8: { ...prev.section8, board_mc: rows } };
    });
  };

  // Physical Test — field top-level (geltime & swelling_jam saja)
  const handlePhysicalField = (key, val) =>
    setFormData(prev => ({ ...prev, section8: { ...prev.section8, [key]: val } }));

  // Emission: JIS input → auto-calc ASTM
  const handleEmissionJis = (val) =>
    setFormData(prev => ({
      ...prev,
      section8: {
        ...prev.section8,
        emission_jis:  val,
        emission_astm: calcAstm(val),
      },
    }));

  // Modulus of Rupture
  const handleMorMoeChange = (idx, key, val) =>
    setFormData(prev => ({
      ...prev,
      section8: {
        ...prev.section8,
        mor_moe: prev.section8.mor_moe.map((r, i) =>
          i === idx ? { ...r, [key]: val } : r
        ),
      },
    }));

  // Surface Soundness
  const handleSurfaceSoundnessChange = (idx, val) =>
    setFormData(prev => {
      const rows = prev.section8.surface_soundness.map((r, i) =>
        i === idx ? { ...r, value: val } : r
      );
      return { ...prev, section8: { ...prev.section8, surface_soundness: rows } };
    });

  const handleSwellingChange = (idx, key, val) => {
    setFormData(prev => {
      const rows = prev.section8.swelling.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [key]: val };
        if (['weight_0h','weight_24h'].includes(key)) {
          const w0  = key === 'weight_0h'  ? val : updated.weight_0h;
          const w24 = key === 'weight_24h' ? val : updated.weight_24h;
          updated.absorption_pct = calcAbsorption(w0, w24);
        }
        if (['thick_0h','thick_24h'].includes(key)) {
          const t0  = key === 'thick_0h'  ? val : updated.thick_0h;
          const t24 = key === 'thick_24h' ? val : updated.thick_24h;
          updated.swelling_pct = calcSwelling(t0, t24);
        }
        return updated;
      });
      return { ...prev, section8: { ...prev.section8, swelling: rows } };
    });
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setFormData(initialState);
    setSubmitError('');
    setSubmitSuccess('');
    if (!isEditMode) {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!formData.tanggal) {
      setSubmitError('Field Tanggal wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const finalStatus = submitStatusRef.current ?? (isEditMode ? formData.status : 'submitted');
    submitStatusRef.current = null;

    const payload = { ...formData, status: finalStatus };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/laporan-qclab-shift/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${id} berhasil diupdate.`);
        setFormData(prev => ({ ...prev, status: payload.status }));
      } else {
        const res = await axios.post(`${API_URL}/laporan-qclab-shift`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmitSuccess(`Laporan #${res.data.id} berhasil disimpan (Status: ${res.data.status}).`);
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

  // ── Status badge config ────────────────────────────────────────────────────

  const statusBadge = {
    draft:     'bg-slate-100 text-slate-600 border-slate-300',
    submitted: 'bg-blue-50 text-blue-700 border-blue-300',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-300',
  };
  const statusLabel = { draft: '📝 Draft', submitted: '📤 Submitted', approved: '✅ Approved' };

  if (isFetching) {
    return <LoadingState fullPage navbar={<Navbar />} message="Memuat data laporan..." />;
  }

  const radioCls = 'flex items-center gap-2 text-sm text-slate-700 cursor-pointer';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-0.5">
                PT CANANG INDAH INDUSTRI PARTICLE BOARD — MDF LABORATORY
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">Quality Shift Report</h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusBadge[formData.status] ?? statusBadge.draft}`}>
                  {statusLabel[formData.status] ?? 'Draft'}
                </span>
                {isEditMode && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase">
                    Edit #{id}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">IN-PROCESS TESTING</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/qclab/dashboard')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {!isEditMode && hasDraft && !submitSuccess && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
            <span>📋 Draft tersimpan secara otomatis.</span>
            <button onClick={handleReset} className="text-xs font-semibold underline hover:text-amber-900">Hapus Draft</button>
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

          {/* ── A. Informasi Umum ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="A" title="Informasi Umum" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input type="date" value={formData.tanggal}
                  onChange={e => setField('tanggal', e.target.value)}
                  disabled={isSubmitting} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift / Group</label>
                <input
                  type="text"
                  value={formData.shift_group}
                  onChange={e => setField('shift_group', e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Contoh: Shift 1 / Group A"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Laporan</label>
                <select value={formData.status}
                  onChange={e => setField('status', e.target.value)}
                  disabled={isSubmitting} className={inputCls}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIK / Nama Pemeriksa 1</label>
                <input type="text" value={formData.nik_nama_1}
                  onChange={e => setField('nik_nama_1', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: 12345 / Andi S."
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIK / Nama Pemeriksa 2</label>
                <input type="text" value={formData.nik_nama_2}
                  onChange={e => setField('nik_nama_2', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: 67890 / Budi R."
                  className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Kondisi Pencahayaan Lampu</p>
                <div className="flex gap-6">
                  {['OK', 'Not OK'].map(opt => (
                    <label key={opt} className={radioCls}>
                      <input type="radio" name="kondisi_lampu" value={opt}
                        checked={formData.kondisi_lampu === opt}
                        onChange={e => setField('kondisi_lampu', e.target.value)}
                        disabled={isSubmitting} className="accent-teal-600 w-4 h-4" />
                      <span className={`font-medium ${opt === 'OK' ? 'text-emerald-700' : 'text-red-600'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Lokasi Kerja</p>
                <div className="flex gap-6">
                  {['Bersih', 'Tidak Bersih'].map(opt => (
                    <label key={opt} className={radioCls}>
                      <input type="radio" name="lokasi_kerja" value={opt}
                        checked={formData.lokasi_kerja === opt}
                        onChange={e => setField('lokasi_kerja', e.target.value)}
                        disabled={isSubmitting} className="accent-teal-600 w-4 h-4" />
                      <span className={`font-medium ${opt === 'Bersih' ? 'text-emerald-700' : 'text-red-600'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 1: Chips Moisture Content & pH ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel letter="1" title="Chips Moisture Content & pH" />
              <button type="button" onClick={handleAddMoistureRow} disabled={isSubmitting}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50">
                + Tambah Baris
              </button>
            </div>
            <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              📐 MC (%) = <span className="font-mono">[b − (c − a)] / (c − a) × 100</span>
              &nbsp;·&nbsp; a = container, b = wet chips, c = container + dry chips
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No', 'Container Weight [a]', 'Wet Chips Weight [b]', 'Cont+Dry Chips [c]',
                      'Moisture Content % (auto)', 'pH', 'Hapus'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.chips_moisture.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-2 text-center text-xs text-slate-500 font-medium">{row.nomor}</td>
                      {['container_weight','wet_chips_weight','cont_dry_chips'].map(k => (
                        <td key={k} className="py-1.5 px-1">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handleMoistureChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                      <td className="py-1.5 px-1">
                        <input type="text" readOnly value={row.moisture_content ? `${row.moisture_content}%` : ''}
                          tabIndex={-1} className={autoCls} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" step="any" value={row.ph}
                          onChange={e => handleMoistureChange(i, 'ph', e.target.value)}
                          disabled={isSubmitting} className={numCls} />
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <button type="button" onClick={() => handleDeleteMoistureRow(i)}
                          disabled={isSubmitting || formData.chips_moisture.length <= 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-2 py-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 2: Chips Bulk Density ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel letter="2" title="Chips Bulk Density KG/M³" />
              <button type="button" onClick={handleAddBulkRow} disabled={isSubmitting}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50">
                + Tambah Baris
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[580px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No', 'Weight of Wet Chips', 'Bulk Density Wet', 'Bulk Density Dry', 'Species of Wood', 'Hapus'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.chips_bulk_density.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-2 text-center text-xs text-slate-500 font-medium">{row.nomor}</td>
                      {['wet_chips_weight','bulk_density_wet','bulk_density_dry'].map(k => (
                        <td key={k} className="py-1.5 px-1">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handleBulkChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                      <td className="py-1.5 px-1">
                        <input type="text" list="species-list" value={row.species_of_wood}
                          onChange={e => handleBulkChange(i, 'species_of_wood', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400" />
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <button type="button" onClick={() => handleDeleteBulkRow(i)}
                          disabled={isSubmitting || formData.chips_bulk_density.length <= 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-2 py-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="species-list">
                {['Acacia','Eucalyptus','Mixed Tropical','Rubberwood','Pine'].map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* ── Section 3: Glue Mix Analysis ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel letter="3" title="Glue Mix Analysis" />
            </div>
            <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              📐 Solid Content (%) = <span className="font-mono">((c − a) / b) × 100</span>
            </div>

            {/* Time In / Out */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Time In</label>
                <input type="text" value={formData.glue_mix.time_in}
                  onChange={e => handleGlueField('time_in', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: 08:30"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Time Out</label>
                <input type="text" value={formData.glue_mix.time_out}
                  onChange={e => handleGlueField('time_out', e.target.value)}
                  disabled={isSubmitting} placeholder="Contoh: 09:15"
                  className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
              {/* Sample table */}
              <div className="flex-1 min-w-0 overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sample In
                  </span>
                  <button
                    type="button"
                    onClick={handleAddGlueSampleRow}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
                  >
                    + Tambah Baris
                  </button>
                </div>
                <table className="w-full border-collapse text-sm min-w-[540px]">
                  <thead>
                    <tr className="bg-teal-50 border-b-2 border-teal-200">
                      {['No', 'Sample', 'Foil Weight [a]', 'Gluemix Weight [b]', 'Foil+Dry Glue [c]',
                        'Solid Content% (auto)', 'Remark', ''].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.glue_mix.samples ?? []).map((s, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        {/* No */}
                        <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium w-8">
                          {s.no ?? (i + 1)}
                        </td>
                        {/* Label "In" */}
                        <td className="py-2 px-2 text-center w-14">
                          <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                            In
                          </span>
                        </td>
                        {['foil_weight','gluemix_weight','foil_dry_glue'].map(k => (
                          <td key={k} className="py-1.5 px-1">
                            <input type="number" step="any" value={s[k]}
                              onChange={e => handleGlueSampleChange(i, k, e.target.value)}
                              disabled={isSubmitting} className={numCls} />
                          </td>
                        ))}
                        <td className="py-1.5 px-1">
                          <input type="text" readOnly value={s.solid_content ? `${s.solid_content}%` : ''}
                            tabIndex={-1} className={autoCls} />
                        </td>
                        <td className="py-1.5 px-1">
                          <input type="text" value={s.remark}
                            onChange={e => handleGlueSampleChange(i, 'remark', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400" />
                        </td>
                        {/* Hapus baris */}
                        <td className="py-1.5 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteGlueSampleRow(i)}
                            disabled={isSubmitting || (formData.glue_mix.samples ?? []).length <= 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-2 py-1"
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                    {/* Average row */}
                    <tr className="bg-teal-50 border-t-2 border-teal-200">
                      <td colSpan={5} className="py-2.5 px-3 text-right text-xs font-semibold text-teal-800">
                        Average Solid Content:
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-bold text-teal-800 text-sm">
                          {formData.glue_mix.solid_content_avg
                            ? `${formData.glue_mix.solid_content_avg}%`
                            : <span className="text-teal-400 font-normal">—</span>}
                        </span>
                      </td>
                      <td /><td />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Glue Metrics panel */}
              <div className="lg:w-64 shrink-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Glue Metrics</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid gap-3">
                  {[
                    { key: 'viscosity', label: 'Viscosity (cps)' },
                    { key: 'temp',     label: 'Temp (°C)' },
                    { key: 'density',  label: 'Density (kg/m³)' },
                    { key: 'ph',       label: 'pH' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                      <input type="number" step="any" value={formData.glue_mix[key]}
                        onChange={e => handleGlueField(key, e.target.value)}
                        disabled={isSubmitting} className={numCls} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4: Hardener, Wax & Dynasteam ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel letter="4" title="Hardener, Wax & Dynasteam" />
              <button type="button" onClick={handleAddHardenerRow} disabled={isSubmitting}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50">
                + Tambah Baris
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No', 'Time', '% Hardener on OD Glue', '% Wax on OD Fibre',
                      'Dynasteam Atas', 'Dynasteam Bawah', 'Hapus'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.hardener_wax.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-2 text-center text-xs text-slate-500 font-medium">{row.nomor}</td>
                      <td className="py-1.5 px-1">
                        <input type="time" value={row.time}
                          onChange={e => handleHardenerChange(i, 'time', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400" />
                      </td>
                      {['hardener_pct','wax_pct','dynasteam_atas','dynasteam_bawah'].map(k => (
                        <td key={k} className="py-1.5 px-1">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handleHardenerChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                      <td className="py-1.5 px-1 text-center">
                        <button type="button" onClick={() => handleDeleteHardenerRow(i)}
                          disabled={isSubmitting || formData.hardener_wax.length <= 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-2 py-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 5: Screen Test & MC Fiber ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="5" title="Screen Test & Moisture Content Fiber" />

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
              {[
                { key: 'time_sampling',     label: 'Time Sampling',         type: 'time'   },
                { key: 'discharge_screw',   label: 'Discharge Screw',       type: 'text'   },
                { key: 'blowline_opening',  label: 'Blowline Opening (%)',   type: 'number' },
                { key: 'steam_flow',        label: 'Steam Flow (bar)',       type: 'number' },
                { key: 'refiner_load',      label: 'Refiner Load (Kw)',      type: 'number' },
                { key: 'digester_level',    label: 'Digester Level (Mtr)',   type: 'number' },
                { key: 'digester_pressure', label: 'Digester Pressure (Bar)',type: 'number' },
                { key: 'refiner_level',     label: 'Refiner Level (Bar)',    type: 'number' },
                { key: 'cooking_level',     label: 'Cooking Level (Sec)',    type: 'number' },
                { key: 'mc_quadra_beam',    label: 'MC Quadra Beam',         type: 'number' },
                { key: 'mc_test_lab_qc',   label: 'MC Test Lab. QC',        type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input type={type} step="any" value={formData.screen_test[key]}
                    onChange={e => handleScreenField(key, e.target.value)}
                    disabled={isSubmitting} className={inputCls} />
                </div>
              ))}
            </div>

            {/* Mesh Distribution Table */}
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Screen Test — Mesh Distribution
            </h3>
            <div className="mb-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              📐 Weight Distribution (%) = (Weight Sample / Total Sample) × 100
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['Mesh Size Screen', 'Weight Sample (gr)', 'Weight Distribution % (auto)', 'Specification (%)'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(formData.screen_test.mesh_rows ?? []).map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-3 text-sm font-medium text-slate-700 whitespace-nowrap">{row.mesh_size}</td>
                      <td className="py-1.5 px-1">
                        <input type="number" step="any" value={row.weight_sample}
                          onChange={e => handleMeshChange(i, e.target.value)}
                          disabled={isSubmitting} className={numCls} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="text" readOnly tabIndex={-1}
                          value={row.weight_dist ? `${row.weight_dist}%` : ''}
                          className={autoCls} />
                      </td>
                      <td className="py-2 px-3 text-center text-xs font-semibold text-slate-500">{row.spec}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-teal-50 border-t-2 border-teal-200 font-semibold">
                    <td className="py-2 px-3 text-xs font-semibold text-teal-800">TOTAL</td>
                    <td className="py-2 px-3 text-center font-mono text-sm text-teal-800">
                      {(formData.screen_test.mesh_rows ?? [])
                        .reduce((s, r) => s + (parseFloat(r.weight_sample) || 0), 0)
                        .toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-teal-800">
                      {(() => {
                        const sum = (formData.screen_test.mesh_rows ?? [])
                          .reduce((s, r) => s + (parseFloat(r.weight_dist) || 0), 0);
                        return sum > 0 ? `${sum.toFixed(1)}%` : '—';
                      })()}
                    </td>
                    <td className="py-2 px-3 text-center text-xs font-semibold text-teal-800">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 6: Thickness and Density Distribution ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel letter="6" title="Thickness and Density Distribution" />
              <button type="button" onClick={handleAddThickDensRow} disabled={isSubmitting}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50">
                + Tambah Baris
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No','Time','OD Glue','Fibre MC','Set Weight','Target Density',
                      'Avg Density','Target Thick','Min Thick','Max Thick','Avg Thick',
                      'Length Board','Width Board','Hapus'].map(h => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.thick_density.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-1 text-center text-xs text-slate-500 font-medium w-8">{row.nomor}</td>
                      <td className="py-1 px-1 min-w-[90px]">
                        <input type="time" value={row.time_sampling}
                          onChange={e => handleThickDensChange(i, 'time_sampling', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50" />
                      </td>
                      {['od_glue','fibre_mc','set_weight','target_density','avg_density',
                        'target_thick','min_thick','max_thick','avg_thick','length_board','width_board'].map(k => (
                        <td key={k} className="py-1 px-1 min-w-[70px]">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handleThickDensChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                      <td className="py-1 px-1 text-center">
                        <button type="button" onClick={() => handleDeleteThickDensRow(i)}
                          disabled={isSubmitting || formData.thick_density.length <= 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-1.5 py-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 7: Press & Process Parameters ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel letter="7" title="Press & Process Parameters" />
              <button type="button" onClick={handleAddPressRow} disabled={isSubmitting}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50">
                + Tambah Baris
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[900px]">
                <thead>
                  {/* Merged header row */}
                  <tr className="bg-teal-50 border-b border-teal-200">
                    <th className={`${thCls} border-r border-teal-200`} rowSpan={2}>No</th>
                    <th className={`${thCls} border-r border-teal-200`} rowSpan={2}>Temp. Inlet Press (°C)</th>
                    <th className={`${thCls} border-r border-teal-200`} rowSpan={2}>Speed Press</th>
                    <th className={`${thCls} border-r border-teal-200`} colSpan={3}>Density Profil</th>
                    <th className={`${thCls} border-r border-teal-200`} colSpan={2}>Internal Bonding</th>
                    <th className={thCls} colSpan={4}>Heating</th>
                    <th className={thCls} rowSpan={2}>Hapus</th>
                  </tr>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['Max Density','Min Core Density','Ratio Dens Min/Avg'].map(h => (
                      <th key={h} className={`${thCls} border-r border-teal-100`}>{h}</th>
                    ))}
                    {['Average','Minimum'].map(h => (
                      <th key={h} className={`${thCls} border-r border-teal-100`}>{h}</th>
                    ))}
                    {['1','2','3','4'].map(h => (
                      <th key={h} className={thCls}>H{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.press_params.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-1 text-center text-xs text-slate-500 font-medium w-8">{row.nomor}</td>
                      {['temp_inlet_press','speed_press','max_density','min_core_density','ratio_dens',
                        'ib_average','ib_minimum','heating_1','heating_2','heating_3','heating_4'].map(k => (
                        <td key={k} className="py-1 px-1 min-w-[65px]">
                          <input type="number" step="any" value={row[k]}
                            onChange={e => handlePressChange(i, k, e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>
                      ))}
                      <td className="py-1 px-1 text-center">
                        <button type="button" onClick={() => handleDeletePressRow(i)}
                          disabled={isSubmitting || formData.press_params.length <= 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-1.5 py-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 8: Board MC, Physical Test, Swelling & Absorption ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="8" title="Board MC, Physical Test, Swelling & Absorption" />

            {/* Formula hint */}
            <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 flex flex-wrap gap-x-4 gap-y-1">
              <span>📐 MC % = ((W.Before − W.After) / W.After) × 100</span>
              <span>📐 Absorption % = ((W.24h − W.0h) / W.0h) × 100</span>
              <span>📐 Swelling % = ((T.24h − T.0h) / T.0h) × 100</span>
            </div>

            <div className="overflow-x-auto">
              <table className="border-collapse text-xs w-full" style={{ minWidth: '1100px' }}>
                <thead>
                  {/* ── Baris 1: Group headers ── */}
                  <tr className="bg-teal-600 text-white">
                    {/* Grup 1: Board MC */}
                    <th
                      colSpan={4}
                      className="text-center py-2 px-3 text-xs font-semibold border border-teal-500 whitespace-nowrap"
                    >
                      Board MC : Oven (24h, 105°C)
                    </th>

                    {/* Grup 2: Physical Test */}
                    <th
                      colSpan={3}
                      className="text-center py-2 px-3 text-xs font-semibold border border-teal-500 whitespace-nowrap"
                    >
                      Physical Test
                    </th>

                    {/* Grup 3: Swelling — header dengan input jam */}
                    <th
                      colSpan={7}
                      className="text-center py-2 px-3 text-xs font-semibold border border-teal-500"
                    >
                      <span className="mr-2">Swelling and Absorption in water (24h, 20°C), Jam :</span>
                      <input
                        type="text"
                        value={formData.section8.swelling_jam ?? ''}
                        onChange={e => handlePhysicalField('swelling_jam', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="hh:mm"
                        className="inline-block w-20 px-2 py-0.5 rounded text-xs text-slate-800 bg-white border border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-300"
                      />
                    </th>
                  </tr>

                  {/* ── Baris 2: Column headers ── */}
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {/* Board MC cols */}
                    <th className={`${thCls} border border-slate-200 w-8`}>No</th>
                    <th className={`${thCls} border border-slate-200`}>Weight Before (g)</th>
                    <th className={`${thCls} border border-slate-200`}>Weight After (g)</th>
                    <th className={`${thCls} border border-slate-200`}>MC %</th>
                    {/* Physical Test cols */}
                    <th className={`${thCls} border border-slate-200`}>SH Face (N)</th>
                    <th className={`${thCls} border border-slate-200`}>SH Edge (N)</th>
                    <th className={`${thCls} border border-slate-200`}>Geltime Sec</th>
                    {/* Swelling cols */}
                    <th className={`${thCls} border border-slate-200 w-8`}>No</th>
                    <th className={`${thCls} border border-slate-200`}>Weight (0 h) (g)</th>
                    <th className={`${thCls} border border-slate-200`}>Thick (0 h) (mm)</th>
                    <th className={`${thCls} border border-slate-200`}>Weight (24 h) (g)</th>
                    <th className={`${thCls} border border-slate-200`}>Thick (24 h) (mm)</th>
                    <th className={`${thCls} border border-slate-200`}>Absortion After (24 h) In Water</th>
                    <th className={`${thCls} border border-slate-200`}>Swelling After (24 h) In Water</th>
                  </tr>
                </thead>

                <tbody>
                  {/* ── 5 baris data ── */}
                  {Array.from({ length: 5 }, (_, i) => {
                    const mc  = (formData.section8.board_mc   ?? [])[i] ?? emptyBoardMcRow(i + 1);
                    const sw  = (formData.section8.swelling   ?? [])[i] ?? emptySwellingRow(i + 1);
                    const isFirstRow = i === 0;
                    return (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                        {/* No (Board MC) */}
                        <td className="py-1.5 px-2 text-center text-xs text-slate-400 font-medium border border-slate-100">
                          {mc.no}
                        </td>

                        {/* Weight Before */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={mc.weight_before}
                            onChange={e => handleBoardMcChange(i, 'weight_before', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* Weight After */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={mc.weight_after}
                            onChange={e => handleBoardMcChange(i, 'weight_after', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* MC % auto */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="text" readOnly tabIndex={-1}
                            value={mc.mc_pct ? `${mc.mc_pct}%` : ''}
                            className={autoCls} />
                        </td>

                        {/* SH Face per-baris */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={mc.sh_face}
                            onChange={e => handleBoardMcChange(i, 'sh_face', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* SH Edge per-baris */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={mc.sh_edge}
                            onChange={e => handleBoardMcChange(i, 'sh_edge', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* Geltime — rowspan 5, hanya render di baris pertama */}
                        {isFirstRow && (
                          <td
                            rowSpan={5}
                            className="py-1 px-2 border border-slate-200 align-middle text-center"
                          >
                            <input
                              type="number" step="any"
                              value={formData.section8.geltime ?? ''}
                              onChange={e => handlePhysicalField('geltime', e.target.value)}
                              disabled={isSubmitting}
                              className={`${numCls} text-center`}
                            />
                          </td>
                        )}

                        {/* No (Swelling) */}
                        <td className="py-1.5 px-2 text-center text-xs text-slate-400 font-medium border border-slate-100">
                          {sw.no}
                        </td>

                        {/* Weight 0h */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={sw.weight_0h}
                            onChange={e => handleSwellingChange(i, 'weight_0h', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* Thick 0h */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={sw.thick_0h}
                            onChange={e => handleSwellingChange(i, 'thick_0h', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* Weight 24h */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={sw.weight_24h}
                            onChange={e => handleSwellingChange(i, 'weight_24h', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* Thick 24h */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="number" step="any" value={sw.thick_24h}
                            onChange={e => handleSwellingChange(i, 'thick_24h', e.target.value)}
                            disabled={isSubmitting} className={numCls} />
                        </td>

                        {/* Absorption auto */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="text" readOnly tabIndex={-1}
                            value={sw.absorption_pct ? `${sw.absorption_pct}%` : ''}
                            className={autoCls} />
                        </td>

                        {/* Swelling auto */}
                        <td className="py-1 px-1 border border-slate-100">
                          <input type="text" readOnly tabIndex={-1}
                            value={sw.swelling_pct ? `${sw.swelling_pct}%` : ''}
                            className={autoCls} />
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── Baris Avg ── */}
                  <tr className="bg-teal-50 border-t-2 border-teal-200 font-semibold">
                    {/* Board MC: label Avg di bawah Weight After, avg MC% */}
                    <td className="py-2 px-2 text-center text-xs font-bold text-teal-800 border border-teal-100" />
                    <td className="py-2 px-2 border border-teal-100" />
                    <td className="py-2 px-2 text-right text-xs font-bold text-teal-800 border border-teal-100">
                      Avg
                    </td>
                    <td className="py-2 px-2 border border-teal-100">
                      <span className="block text-center font-mono font-bold text-teal-800 text-xs">
                        {avgOf(formData.section8.board_mc ?? [], 'mc_pct')
                          ? `${avgOf(formData.section8.board_mc ?? [], 'mc_pct')}%`
                          : <span className="text-teal-400 font-normal">—</span>}
                      </span>
                    </td>

                    {/* Physical Test — SH Face avg, SH Edge avg, Geltime kosong */}
                    <td className="py-2 px-2 border border-teal-100">
                      <span className="block text-center font-mono text-xs text-teal-700">
                        {avgOf(formData.section8.board_mc ?? [], 'sh_face') || <span className="text-teal-300">—</span>}
                      </span>
                    </td>
                    <td className="py-2 px-2 border border-teal-100">
                      <span className="block text-center font-mono text-xs text-teal-700">
                        {avgOf(formData.section8.board_mc ?? [], 'sh_edge') || <span className="text-teal-300">—</span>}
                      </span>
                    </td>
                    {/* Geltime sudah di-rowspan, baris avg tidak render td Geltime */}

                    {/* Swelling: label Avg di bawah Weight (24h), avg Absorption & Swelling */}
                    <td className="py-2 px-2 border border-teal-100" />
                    <td className="py-2 px-2 border border-teal-100" />
                    <td className="py-2 px-2 border border-teal-100" />
                    <td className="py-2 px-2 border border-teal-100" />
                    <td className="py-2 px-2 text-right text-xs font-bold text-teal-800 border border-teal-100">
                      Avg
                    </td>
                    <td className="py-2 px-2 border border-teal-100" />
                    <td className="py-2 px-2 border border-teal-100">
                      <span className="block text-center font-mono font-bold text-teal-800 text-xs">
                        {avgOf(formData.section8.swelling ?? [], 'absorption_pct')
                          ? `${avgOf(formData.section8.swelling ?? [], 'absorption_pct')}%`
                          : <span className="text-teal-400 font-normal">—</span>}
                      </span>
                    </td>
                    <td className="py-2 px-2 border border-teal-100">
                      <span className="block text-center font-mono font-bold text-teal-800 text-xs">
                        {avgOf(formData.section8.swelling ?? [], 'swelling_pct')
                          ? `${avgOf(formData.section8.swelling ?? [], 'swelling_pct')}%`
                          : <span className="text-teal-400 font-normal">—</span>}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 9: Hasil Emisi (Formaldehyde Emission Test) ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="9" title="Hasil Emisi — Formaldehyde Emission Test" />

            <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              📐 ASTM D 6007 (ppm) = JIS A 1460 (mg/l) ÷ 7.214
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
              {/* JIS A 1460 — input manual */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  JIS A 1460 Test Results (mg/l)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.section8.emission_jis}
                  onChange={e => handleEmissionJis(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Contoh: 0.563"
                  className={numCls}
                />
              </div>

              {/* ASTM D 6007 — read-only auto-calc */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ASTM D 6007 Value (ppm)
                  <span className="ml-1.5 text-xs font-normal text-teal-600">(otomatis)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={formData.section8.emission_astm
                      ? `${formData.section8.emission_astm} ppm`
                      : ''}
                    placeholder="Dihitung otomatis"
                    className={autoCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 10: Modulus of Rupture & Surface Soundness ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
            <SectionLabel letter="10" title="Modulus of Rupture & Surface Soundness" />

            {/* Row 1: MOR/MOE + Surface Soundness berdampingan */}
            <div className="flex flex-col lg:flex-row gap-5 mb-5">

              {/* ── Modulus of Rupture ── */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Modulus of Rupture
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-teal-50 border-b-2 border-teal-200">
                        <th className={thCls}>No</th>
                        <th className={thCls}>MOE</th>
                        <th className={thCls}>MOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.section8.mor_moe ?? []).map((row, i) => (
                        <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                          <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium">{row.no}</td>
                          <td className="py-1.5 px-1">
                            <input type="number" step="any" value={row.moe}
                              onChange={e => handleMorMoeChange(i, 'moe', e.target.value)}
                              disabled={isSubmitting} className={numCls} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input type="number" step="any" value={row.mor}
                              onChange={e => handleMorMoeChange(i, 'mor', e.target.value)}
                              disabled={isSubmitting} className={numCls} />
                          </td>
                        </tr>
                      ))}
                      {/* Baris Avg MOE / MOR — auto-calc, read-only */}
                      <tr className="bg-teal-50 border-t-2 border-teal-200">
                        <td className="py-2 px-2 text-center text-xs font-bold text-teal-800">Avg</td>
                        {(['moe', 'mor']).map(key => {
                          const vals = (formData.section8.mor_moe ?? [])
                            .map(r => parseFloat(r[key]))
                            .filter(v => Number.isFinite(v));
                          const avg = vals.length
                            ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)
                            : '';
                          return (
                            <td key={key} className="py-1.5 px-1">
                              <input
                                type="text" readOnly tabIndex={-1}
                                value={avg}
                                placeholder="—"
                                className={autoCls}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Surface Soundness ── */}
              <div className="lg:w-64 shrink-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Surface Soundness
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-teal-50 border-b-2 border-teal-200">
                        <th className={thCls}>No</th>
                        <th className={thCls}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.section8.surface_soundness ?? []).map((row, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 px-2 text-center text-xs text-slate-400 font-medium">{row.no}</td>
                          <td className="py-1.5 px-1">
                            <input type="number" step="any" value={row.value}
                              onChange={e => handleSurfaceSoundnessChange(i, e.target.value)}
                              disabled={isSubmitting} className={numCls} />
                          </td>
                        </tr>
                      ))}
                      {/* Avg row — auto-calc */}
                      <tr className="bg-teal-50 border-t-2 border-teal-200">
                        <td className="py-2 px-2 text-center text-xs font-semibold text-teal-800">Avg</td>
                        <td className="py-1.5 px-1">
                          <input type="text" readOnly tabIndex={-1}
                            value={(() => {
                              const avg = calcSurfaceAvg(formData.section8.surface_soundness ?? []);
                              return avg ? avg : '';
                            })()}
                            placeholder="—"
                            className={autoCls} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* ── Action Bar ── */}
          <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">            <button type="button" onClick={() => navigate('/qclab/dashboard')}
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
                label={isEditMode ? 'Simpan Perubahan' : '📤 Submit Laporan'}
                loadingLabel="Menyimpan..."
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              />
            </div>
          </div>

        </form>
      </main>
    </div>
  );
};

export default LaporanQcLabShiftReport;
