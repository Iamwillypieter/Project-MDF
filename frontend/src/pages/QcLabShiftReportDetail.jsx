import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';

const API_URL = `http://${window.location.hostname}:5000/api`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmt = (val, decimals = 3) => {
  const n = parseFloat(val);
  if (isNaN(n) || val === '' || val === null || val === undefined) return <span className="text-slate-300">—</span>;
  return n.toFixed(decimals);
};

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    draft:     { cls: 'bg-slate-100 text-slate-600 border-slate-300',   icon: '📝', label: 'Draft'     },
    submitted: { cls: 'bg-blue-50  text-blue-700  border-blue-300',     icon: '📤', label: 'Submitted' },
    approved:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: '✅', label: 'Approved'  },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ── Section wrapper ───────────────────────────────────────────────────────────

const Section = ({ letter, title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-5">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
        {letter}
      </span>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ── Field display helper ──────────────────────────────────────────────────────

const Field = ({ label, value, mono = false }) => (
  <div>
    <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
    <p className={`text-sm font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>
      {value || <span className="text-slate-400">—</span>}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * QcLabShiftReportDetail — /qclab/quality-shift-report/detail/:id
 * Tampilan read-only lengkap untuk satu Quality Shift Report.
 */
const QcLabShiftReportDetail = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token, user } = useAuth();
  const canEdit   = user?.role === 'qc_lab' || user?.role === 'admin';

  const [laporan,  setLaporan]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_URL}/laporan-qclab-shift/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLaporan(res.data.laporan);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data laporan.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  if (loading) {
    return <LoadingState fullPage navbar={<Navbar />} message="Memuat detail laporan..." />;
  }

  if (error || !laporan) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
            ❌ {error || 'Laporan tidak ditemukan.'}
          </div>
          <button onClick={() => navigate('/qclab/history')}
            className="mt-4 text-sm text-slate-600 hover:text-slate-800">
            ← Kembali ke History
          </button>
        </main>
      </div>
    );
  }

  const chipsM      = Array.isArray(laporan.chips_moisture)     ? laporan.chips_moisture     : [];
  const chipsB      = Array.isArray(laporan.chips_bulk_density) ? laporan.chips_bulk_density : [];
  const glue        = laporan.glue_mix && typeof laporan.glue_mix === 'object' ? laporan.glue_mix : {};
  const samples     = Array.isArray(glue.samples) ? glue.samples : [];
  const hardenerWax = Array.isArray(laporan.hardener_wax)  ? laporan.hardener_wax  : [];
  const screenTest  = laporan.screen_test && typeof laporan.screen_test === 'object' ? laporan.screen_test : {};
  const meshRows    = Array.isArray(screenTest.mesh_rows) ? screenTest.mesh_rows : [];
  const thickDens   = Array.isArray(laporan.thick_density) ? laporan.thick_density : [];
  const pressParams = Array.isArray(laporan.press_params)  ? laporan.press_params  : [];
  const sec8        = laporan.section8 && typeof laporan.section8 === 'object' ? laporan.section8 : {};
  const boardMc     = Array.isArray(sec8.board_mc)  ? sec8.board_mc  : [];
  const swelling    = Array.isArray(sec8.swelling)  ? sec8.swelling  : [];

  const avgOf = (arr, key) => {
    const vals = arr.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : null;
  };

  // Warna kondisi
  const kondisiColor = laporan.kondisi_lampu === 'OK'
    ? 'text-emerald-700 bg-emerald-50'
    : 'text-red-600 bg-red-50';
  const lokasiColor = laporan.lokasi_kerja === 'Bersih'
    ? 'text-emerald-700 bg-emerald-50'
    : 'text-amber-700 bg-amber-50';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-0.5">
                PT CANANG INDAH INDUSTRI PARTICLE BOARD — MDF LABORATORY
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">Quality Shift Report #{id}</h1>
                <StatusBadge status={laporan.status} />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">IN-PROCESS TESTING</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {canEdit && (
                <Link
                  to={`/qclab/quality-shift-report/edit/${id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                             text-white bg-teal-600 hover:bg-teal-700 transition-colors no-underline"
                >
                  ✏️ Edit Laporan
                </Link>
              )}
              <button
                onClick={() => navigate('/qclab/history')}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>

        {/* ── A. Informasi Umum ── */}
        <Section letter="A" title="Informasi Umum">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-5">
            <Field label="Tanggal"       value={formatDate(laporan.tanggal)} />
            <Field label="Shift / Group" value={laporan.shift_group} />
            <Field label="Pemeriksa 1"   value={laporan.nik_nama_1} />
            <Field label="Pemeriksa 2"   value={laporan.nik_nama_2} />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Kondisi Lampu</p>
              <span className={`inline-block text-sm font-semibold px-2.5 py-1 rounded-full ${kondisiColor}`}>
                {laporan.kondisi_lampu || '—'}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Lokasi Kerja</p>
              <span className={`inline-block text-sm font-semibold px-2.5 py-1 rounded-full ${lokasiColor}`}>
                {laporan.lokasi_kerja || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              <span className="text-slate-400 uppercase tracking-wide">Dibuat oleh</span>
              <p className="font-medium text-slate-700 mt-0.5">{laporan.operator_name || '—'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wide">Tanggal Buat</span>
              <p className="font-medium text-slate-700 mt-0.5">{formatDateTime(laporan.created_at)}</p>
            </div>
          </div>
        </Section>

        {/* ── B. Chips Moisture Content & pH ── */}
        <Section letter="B" title="Chips Moisture Content & pH">
          {chipsM.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Tidak ada data.</p>
          ) : (
            <>
              <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                📐 MC (%) = <span className="font-mono">((b − (c − a)) / b) × 100</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-teal-50 border-b-2 border-teal-200">
                      {['No.', 'Container Weight (gr) [a]', 'Wet Chips Weight (gr) [b]',
                        'Cont + Dry Chips (gr) [c]', 'Moisture Content (%)', 'pH'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chipsM.map((row, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{row.nomor}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.container_weight)}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.wet_chips_weight)}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.cont_dry_chips)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono font-semibold text-teal-700">
                            {fmt(row.moisture_content, 2)}{row.moisture_content !== '' && row.moisture_content !== undefined ? '%' : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.ph, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Section>

        {/* ── C. Chips Bulk Density ── */}
        <Section letter="C" title="Chips Bulk Density (KG/M³)">
          {chipsB.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Tidak ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[580px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No.', 'Weight of Wet Chips (gr)', 'Bulk Density Wet (KG/M³)',
                      'Bulk Density Dry (KG/M³)', 'Species of Wood'].map(h => (
                      <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chipsB.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{row.nomor}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.wet_chips_weight)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.bulk_density_wet)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.bulk_density_dry)}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {row.species_of_wood || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── D. Glue Mix Analysis ── */}
        <Section letter="D" title="Glue Mix Analysis">

          {/* Time In / Out */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-5">
            <Field label="Time In"  value={glue.time_in  || '—'} />
            <Field label="Time Out" value={glue.time_out || '—'} />
          </div>

          <div className="flex flex-col lg:flex-row gap-5">

            {/* Sample Matrix */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Sample Matrix
              </h3>
              {samples.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">Tidak ada data.</p>
              ) : (
                <>
                  <div className="mb-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    📐 Solid Content (%) = <span className="font-mono">((c − a) / b) × 100</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm min-w-[520px]">
                      <thead>
                        <tr className="bg-teal-50 border-b-2 border-teal-200">
                          {['No', 'Sample', 'Foil Weight (gr) [a]', 'Gluemix Weight (gr) [b]',
                            'Foil + Dry Glue (gr) [c]', 'Solid Content (%)', 'Remark'].map(h => (
                            <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {samples.map((s, i) => (
                          <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                            {/* No */}
                            <td className="py-2.5 px-3 text-center text-xs text-slate-400 font-medium">
                              {s.no ?? (i + 1)}
                            </td>
                            {/* Label "In" */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                                In
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(s.foil_weight)}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(s.gluemix_weight)}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(s.foil_dry_glue)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono font-semibold text-teal-700">
                                {fmt(s.solid_content, 2)}{s.solid_content !== '' && s.solid_content !== undefined ? '%' : ''}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-xs">
                              {s.remark || <span className="text-slate-300">—</span>}
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
                              {glue.solid_content_avg
                                ? `${glue.solid_content_avg}%`
                                : <span className="text-teal-400 font-normal">—</span>
                              }
                            </span>
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Glue Metrics */}
            <div className="lg:w-56 shrink-0">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Glue Metrics
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
                <Field label="Viscosity (cps)" value={glue.viscosity ? `${glue.viscosity} cps` : null} mono />
                <Field label="Temp (°C)"        value={glue.temp      ? `${glue.temp} °C`       : null} mono />
                <Field label="Density (kg/m³)"  value={glue.density   ? `${glue.density} kg/m³`  : null} mono />
                <Field label="pH"               value={glue.ph        ? String(glue.ph)          : null} mono />
              </div>
            </div>

          </div>
        </Section>

        {/* ── E. Hardener, Wax & Dynasteam ── */}
        <Section letter="E" title="Hardener, Wax & Dynasteam">
          {hardenerWax.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Tidak ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No.', 'Time', '% Hardener on OD Glue', '% Wax on OD Fibre', 'Dynasteam Atas', 'Dynasteam Bawah'].map(h => (
                      <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hardenerWax.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{row.nomor ?? i + 1}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{row.time || '—'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.hardener_pct, 2)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.wax_pct, 2)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.dynasteam_atas, 2)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.dynasteam_bawah, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── F. Screen Test & MC Fiber ── */}
        <Section letter="F" title="Screen Test & Moisture Content Fiber">
          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Time Sampling',          val: screenTest.time_sampling     },
              { label: 'Discharge Screw',        val: screenTest.discharge_screw   },
              { label: 'Blowline Opening (%)',   val: screenTest.blowline_opening  },
              { label: 'Steam Flow (bar)',        val: screenTest.steam_flow        },
              { label: 'Refiner Load (Kw)',       val: screenTest.refiner_load      },
              { label: 'Digester Level (Mtr)',   val: screenTest.digester_level    },
              { label: 'Digester Pressure (Bar)',val: screenTest.digester_pressure },
              { label: 'Refiner Level (Bar)',    val: screenTest.refiner_level     },
              { label: 'Cooking Level (Sec)',    val: screenTest.cooking_level     },
              { label: 'MC Quadra Beam',         val: screenTest.mc_quadra_beam    },
              { label: 'MC Test Lab. QC',        val: screenTest.mc_test_lab_qc    },
            ].map(({ label, val }) => (
              <Field key={label} label={label} value={val} mono />
            ))}
          </div>

          {/* Mesh Distribution */}
          {meshRows.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Screen Test — Mesh Distribution
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-teal-50 border-b-2 border-teal-200">
                      {['Mesh Size', 'Weight Sample (gr)', 'Weight Distribution %', 'Specification'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meshRows.map((row, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{row.mesh_size}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.weight_sample)}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-teal-700">
                          {row.weight_dist ? `${row.weight_dist}%` : fmt(null)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500">{row.spec}</td>
                      </tr>
                    ))}
                    <tr className="bg-teal-50 border-t-2 border-teal-200 font-semibold">
                      <td className="py-2.5 px-3 text-xs font-semibold text-teal-800">TOTAL</td>
                      <td className="py-2.5 px-3 text-center font-mono text-teal-800">
                        {meshRows.reduce((s, r) => s + (parseFloat(r.weight_sample) || 0), 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">100%</td>
                      <td className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Section>

        {/* ── G. Thickness and Density Distribution ── */}
        <Section letter="G" title="Thickness and Density Distribution">
          {thickDens.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Tidak ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['No','Time','OD Glue','Fibre MC','Set Weight','Target Density',
                      'Avg Density','Target Thick','Min Thick','Max Thick','Avg Thick',
                      'Length Board','Width Board'].map(h => (
                      <th key={h} className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {thickDens.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-medium">{row.nomor}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">{row.time_sampling || '—'}</td>
                      {['od_glue','fibre_mc','set_weight','target_density','avg_density',
                        'target_thick','min_thick','max_thick','avg_thick','length_board','width_board'].map(k => (
                        <td key={k} className="py-2.5 px-2 text-center font-mono text-slate-700">{fmt(row[k], 2)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── H. Press & Process Parameters ── */}
        <Section letter="H" title="Press & Process Parameters">
          {pressParams.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Tidak ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-200">
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-200" rowSpan={2}>No</th>
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-200" rowSpan={2}>Temp. Inlet (°C)</th>
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-200" rowSpan={2}>Speed Press</th>
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-200" colSpan={3}>Density Profil</th>
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-200" colSpan={2}>Internal Bonding</th>
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800" colSpan={4}>Heating</th>
                  </tr>
                  <tr className="bg-teal-50 border-b-2 border-teal-200">
                    {['Max Density','Min Core','Ratio'].map(h => (
                      <th key={h} className="py-2 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-100">{h}</th>
                    ))}
                    {['Average','Minimum'].map(h => (
                      <th key={h} className="py-2 px-2 text-center text-xs font-semibold text-teal-800 border-r border-teal-100">{h}</th>
                    ))}
                    {['H1','H2','H3','H4'].map(h => (
                      <th key={h} className="py-2 px-2 text-center text-xs font-semibold text-teal-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pressParams.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-medium">{row.nomor}</td>
                      {['temp_inlet_press','speed_press','max_density','min_core_density','ratio_dens',
                        'ib_average','ib_minimum','heating_1','heating_2','heating_3','heating_4'].map(k => (
                        <td key={k} className="py-2.5 px-2 text-center font-mono text-slate-700">{fmt(row[k], 2)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── I. Board MC, Physical Test, Swelling & Absorption ── */}
        <Section letter="I" title="Board MC, Physical Test, Swelling & Absorption">

          {/* Formula hint */}
          <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 flex flex-wrap gap-x-4 gap-y-1">
            <span>📐 MC % = ((W.Before − W.After) / W.After) × 100</span>
            <span>📐 Absorption % = ((W.24h − W.0h) / W.0h) × 100</span>
            <span>📐 Swelling % = ((T.24h − T.0h) / T.0h) × 100</span>
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse text-xs w-full" style={{ minWidth: '1100px' }}>
              <thead>
                {/* Group header */}
                <tr className="bg-teal-600 text-white">
                  <th colSpan={4} className="text-center py-2 px-3 text-xs font-semibold border border-teal-500">
                    Board MC : Oven (24h, 105°C)
                  </th>
                  <th colSpan={3} className="text-center py-2 px-3 text-xs font-semibold border border-teal-500">
                    Physical Test
                  </th>
                  <th colSpan={7} className="text-center py-2 px-3 text-xs font-semibold border border-teal-500">
                    Swelling and Absorption in water (24h, 20°C)
                    {sec8.swelling_jam ? `, Jam: ${sec8.swelling_jam}` : ''}
                  </th>
                </tr>
                {/* Column headers */}
                <tr className="bg-teal-50 border-b-2 border-teal-200">
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200 w-8">No</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Weight Before (g)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Weight After (g)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">MC %</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">SH Face (N)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">SH Edge (N)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Geltime Sec</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200 w-8">No</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Weight (0 h) (g)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Thick (0 h) (mm)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Weight (24 h) (g)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Thick (24 h) (mm)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Absortion After (24 h)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-teal-800 border border-slate-200">Swelling After (24 h)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, i) => {
                  const mc = boardMc[i] ?? { no: i + 1 };
                  const sw = swelling[i] ?? { no: i + 1 };
                  return (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-2 text-center text-slate-400 font-medium border border-slate-100">{mc.no}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">{fmt(mc.weight_before)}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">{fmt(mc.weight_after)}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-teal-700 border border-slate-100">
                        {mc.mc_pct ? `${mc.mc_pct}%` : fmt(null)}
                      </td>
                      {/* SH Face & SH Edge dari board_mc rows (skema baru) */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">
                        {fmt(mc.sh_face ?? sec8.sh_face)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">
                        {fmt(mc.sh_edge ?? sec8.sh_edge)}
                      </td>
                      {/* Geltime — rowspan 5 hanya baris pertama */}
                      {i === 0 && (
                        <td rowSpan={5} className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 border border-slate-100 align-middle">
                          {fmt(sec8.geltime)}
                        </td>
                      )}
                      {/* Swelling */}
                      <td className="py-2.5 px-2 text-center text-slate-400 font-medium border border-slate-100">{sw.no}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">{fmt(sw.weight_0h)}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">{fmt(sw.thick_0h)}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">{fmt(sw.weight_24h)}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border border-slate-100">{fmt(sw.thick_24h)}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-teal-700 border border-slate-100">
                        {sw.absorption_pct ? `${sw.absorption_pct}%` : fmt(null)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-teal-700 border border-slate-100">
                        {sw.swelling_pct ? `${sw.swelling_pct}%` : fmt(null)}
                      </td>
                    </tr>
                  );
                })}
                {/* Avg row */}
                <tr className="bg-teal-50 border-t-2 border-teal-200 font-semibold">
                  <td className="py-2.5 px-2 border border-teal-100" />
                  <td className="py-2.5 px-2 border border-teal-100" />
                  <td className="py-2.5 px-2 text-right text-xs font-bold text-teal-800 border border-teal-100">Avg</td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800 border border-teal-100">
                    {avgOf(boardMc, 'mc_pct') ? `${avgOf(boardMc, 'mc_pct')}%` : <span className="text-teal-400">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-teal-700 border border-teal-100">
                    {avgOf(boardMc, 'sh_face') || <span className="text-teal-300">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-teal-700 border border-teal-100">
                    {avgOf(boardMc, 'sh_edge') || <span className="text-teal-300">—</span>}
                  </td>
                  {/* Geltime sudah di-rowspan, tidak ada td di sini */}
                  <td className="py-2.5 px-2 border border-teal-100" />
                  <td className="py-2.5 px-2 border border-teal-100" />
                  <td className="py-2.5 px-2 border border-teal-100" />
                  <td className="py-2.5 px-2 text-right text-xs font-bold text-teal-800 border border-teal-100">Avg</td>
                  <td className="py-2.5 px-2 border border-teal-100" />
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800 border border-teal-100">
                    {avgOf(swelling, 'absorption_pct') ? `${avgOf(swelling, 'absorption_pct')}%` : <span className="text-teal-400">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800 border border-teal-100">
                    {avgOf(swelling, 'swelling_pct') ? `${avgOf(swelling, 'swelling_pct')}%` : <span className="text-teal-400">—</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── J. Hasil Emisi (Formaldehyde Emission Test) ── */}
        <Section letter="J" title="Hasil Emisi — Formaldehyde Emission Test">
          <div className="mb-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            📐 ASTM D 6007 (ppm) = JIS A 1460 (mg/l) ÷ 7.214
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-lg">
            <Field
              label="JIS A 1460 Test Results (mg/l)"
              value={sec8.emission_jis ? `${sec8.emission_jis} mg/l` : null}
              mono
            />
            <Field
              label="ASTM D 6007 Value (ppm)"
              value={sec8.emission_astm ? `${sec8.emission_astm} ppm` : null}
              mono
            />
          </div>
        </Section>

        {/* ── K. Modulus of Rupture, Surface Soundness & Sortir Ulang ── */}
        <Section letter="K" title="Modulus of Rupture, Surface Soundness & Sortir Ulang">
          <div className="flex flex-col lg:flex-row gap-5 mb-5">

            {/* Modulus of Rupture */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Modulus of Rupture</h3>
              {(sec8.mor_moe ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 py-3">Tidak ada data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-teal-50 border-b-2 border-teal-200">
                        {['No','MOE','MOR'].map(h => (
                          <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sec8.mor_moe ?? []).map((row, i) => (
                        <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{row.no}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.moe)}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.mor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Surface Soundness */}
            <div className="lg:w-56 shrink-0">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Surface Soundness</h3>
              {(sec8.surface_soundness ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 py-3">Tidak ada data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-teal-50 border-b-2 border-teal-200">
                        {['No','Value'].map(h => (
                          <th key={h} className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sec8.surface_soundness ?? []).map((row, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{row.no}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{fmt(row.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-teal-50 border-t-2 border-teal-200">
                        <td className="py-2.5 px-3 text-center text-xs font-semibold text-teal-800">Avg</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">
                          {(() => {
                            const vals = (sec8.surface_soundness ?? []).map(r => parseFloat(r.value)).filter(v => !isNaN(v));
                            return vals.length
                              ? `${(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3)}`
                              : <span className="text-teal-400">—</span>;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>


        </Section>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate('/qclab/history')}
            className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            ← Kembali ke History
          </button>
          {canEdit && (
            <Link
              to={`/qclab/quality-shift-report/edit/${id}`}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors no-underline"
            >
              ✏️ Edit Laporan Ini
            </Link>
          )}
        </div>

      </main>
    </div>
  );
};

export default QcLabShiftReportDetail;
