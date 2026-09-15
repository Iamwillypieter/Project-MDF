/**
 * PrintQcLabShift — Print view lengkap untuk Quality Shift Report
 * Semua section A–K ditampilkan dalam format cetak A4 landscape
 */
import PrintLayout from '../PrintLayout';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const fmt = (v, dec = 3) => {
  const n = parseFloat(v);
  return isNaN(n) || v === '' || v == null ? '—' : n.toFixed(dec);
};

const avgOf = (arr, key) => {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  const vals = arr.map((r) => parseFloat(r[key])).filter((v) => !isNaN(v));
  return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : '—';
};

// Shared table styles
const TH = {
  border: '0.5pt solid #333',
  background: '#d4edda',
  padding: '3pt 4pt',
  textAlign: 'center',
  fontSize: '7.5pt',
  fontWeight: 'bold',
};
const TD = {
  border: '0.5pt solid #333',
  padding: '2.5pt 4pt',
  textAlign: 'center',
  fontSize: '8pt',
};
const TDL = { ...TD, textAlign: 'left' };

const SecTitle = ({ letter, title }) => (
  <div style={{
    background: '#1a7a60',
    color: 'white',
    padding: '3pt 6pt',
    fontSize: '8pt',
    fontWeight: 'bold',
    marginTop: '6pt',
    marginBottom: '2pt',
    letterSpacing: '0.5pt',
  }}>
    {letter}. {title}
  </div>
);

// ── Komponen utama ────────────────────────────────────────────────────────────
const PrintQcLabShift = ({ data }) => {
  if (!data) return null;

  const chipsM      = Array.isArray(data.chips_moisture)     ? data.chips_moisture     : [];
  const chipsB      = Array.isArray(data.chips_bulk_density) ? data.chips_bulk_density : [];
  const glue        = (data.glue_mix && typeof data.glue_mix === 'object') ? data.glue_mix : {};
  const samples     = Array.isArray(glue.samples) ? glue.samples : [];
  const hardenerWax = Array.isArray(data.hardener_wax)  ? data.hardener_wax  : [];
  const screenTest  = (data.screen_test && typeof data.screen_test === 'object') ? data.screen_test : {};
  const meshRows    = Array.isArray(screenTest.mesh_rows) ? screenTest.mesh_rows : [];
  const thickDens   = Array.isArray(data.thick_density)  ? data.thick_density  : [];
  const pressParams = Array.isArray(data.press_params)   ? data.press_params   : [];
  const sec8        = (data.section8 && typeof data.section8 === 'object') ? data.section8 : {};
  const boardMc     = Array.isArray(sec8.board_mc)  ? sec8.board_mc  : [];
  const swelling    = Array.isArray(sec8.swelling)  ? sec8.swelling  : [];
  const morMoe      = Array.isArray(sec8.mor_moe)   ? sec8.mor_moe   : [];
  const surfSound   = Array.isArray(sec8.surface_soundness) ? sec8.surface_soundness : [];

  const statusLabel = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved' };

  return (
    <PrintLayout
      title="Quality Shift Report — In-Process Testing"
      subtitle="MDF LABORATORY — PT CANANG INDAH INDUSTRI PARTICLE BOARD"
      docNo={`#${data.id}`}
      date={formatDate(data.tanggal)}
      meta={[
        { label: 'Shift / Group',  value: data.shift_group  },
        { label: 'Pemeriksa 1',    value: data.nik_nama_1   },
        { label: 'Pemeriksa 2',    value: data.nik_nama_2   },
        { label: 'Kondisi Lampu',  value: data.kondisi_lampu },
        { label: 'Lokasi Kerja',   value: data.lokasi_kerja  },
        { label: 'Status',         value: statusLabel[data.status] || data.status },
        { label: 'Dibuat oleh',    value: data.operator_name },
      ]}
      remarks=""
      signatories={[
        { role: 'Prepared by / Tester',    name: data.nik_nama_1 || '' },
        { role: 'Checked by / QC Leader',  name: '' },
        { role: 'Approved by / Manager',   name: '' },
      ]}
    >

      {/* ── A. Chips Moisture Content & pH ─────────────────────── */}
      {chipsM.length > 0 && (
        <div className="print-avoid-break">
          <SecTitle letter="A" title="Chips Moisture Content & pH" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['No.','Container Weight (g) [a]','Wet Chips Weight (g) [b]','Cont+Dry Chips (g) [c]','Moisture Content (%)','pH'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chipsM.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{r.nomor ?? i+1}</td>
                  <td style={TD}>{fmt(r.container_weight)}</td>
                  <td style={TD}>{fmt(r.wet_chips_weight)}</td>
                  <td style={TD}>{fmt(r.cont_dry_chips)}</td>
                  <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{fmt(r.moisture_content,2)}{r.moisture_content != null && r.moisture_content !== '' ? '%' : ''}</td>
                  <td style={TD}>{fmt(r.ph,1)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f0faf6' }}>
                <td colSpan={4} style={{...TDL, fontWeight:'bold', fontSize:'7.5pt'}}>Average MC (%)</td>
                <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{avgOf(chipsM,'moisture_content')}%</td>
                <td style={TD}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── B. Chips Bulk Density ──────────────────────────────── */}
      {chipsB.length > 0 && (
        <div className="print-avoid-break">
          <SecTitle letter="B" title="Chips Bulk Density (KG/M³)" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['No.','Weight of Wet Chips (g)','Bulk Density Wet (KG/M³)','Bulk Density Dry (KG/M³)','Species of Wood'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chipsB.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{r.nomor ?? i+1}</td>
                  <td style={TD}>{fmt(r.wet_chips_weight)}</td>
                  <td style={TD}>{fmt(r.bulk_density_wet)}</td>
                  <td style={TD}>{fmt(r.bulk_density_dry)}</td>
                  <td style={TDL}>{r.species_of_wood || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── C. Glue Mix Analysis ──────────────────────────────── */}
      <div className="print-avoid-break">
        <SecTitle letter="C" title="Glue Mix Analysis" />
        <div style={{ display:'flex', gap:'8pt', marginBottom:'4pt' }}>
          {[['Time In', glue.time_in],['Time Out', glue.time_out],['Viscosity (cps)', glue.viscosity],
            ['Temp (°C)', glue.temp],['Density (kg/m³)', glue.density],['pH', glue.ph],
            ['Avg Solid Content (%)', glue.solid_content_avg ? `${glue.solid_content_avg}%` : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ border:'0.5pt solid #ccc', padding:'3pt 5pt', fontSize:'8pt', flex:1 }}>
              <div style={{ color:'#555', fontSize:'7pt' }}>{label}</div>
              <div style={{ fontWeight:'bold' }}>{val || '—'}</div>
            </div>
          ))}
        </div>
        {samples.length > 0 && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Foil Weight (g) [a]','Gluemix Weight (g) [b]','Foil+Dry Glue (g) [c]','Solid Content (%)','Remark'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((s, i) => (
                <tr key={i}>
                  <td style={TD}>{s.no ?? i+1}</td>
                  <td style={TD}>{fmt(s.foil_weight)}</td>
                  <td style={TD}>{fmt(s.gluemix_weight)}</td>
                  <td style={TD}>{fmt(s.foil_dry_glue)}</td>
                  <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{fmt(s.solid_content,2)}{s.solid_content != null && s.solid_content !== '' ? '%' : ''}</td>
                  <td style={TDL}>{s.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── D. Hardener, Wax & Dynasteam ──────────────────────── */}
      {hardenerWax.length > 0 && (
        <div className="print-avoid-break">
          <SecTitle letter="D" title="Hardener, Wax & Dynasteam" />
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No.','Time','% Hardener on OD Glue','% Wax on OD Fibre','Dynasteam Atas','Dynasteam Bawah'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hardenerWax.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{r.nomor ?? i+1}</td>
                  <td style={TD}>{r.time || '—'}</td>
                  <td style={TD}>{fmt(r.hardener_pct,2)}</td>
                  <td style={TD}>{fmt(r.wax_pct,2)}</td>
                  <td style={TD}>{fmt(r.dynasteam_atas,2)}</td>
                  <td style={TD}>{fmt(r.dynasteam_bawah,2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── E. Screen Test & MC Fiber ──────────────────────────── */}
      <div className="print-page-break" />
      <div className="print-avoid-break">
        <SecTitle letter="E" title="Screen Test & Moisture Content Fiber" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'4pt', marginBottom:'4pt' }}>
          {[
            ['Time Sampling',          screenTest.time_sampling],
            ['Discharge Screw',        screenTest.discharge_screw],
            ['Blowline Opening (%)',   screenTest.blowline_opening],
            ['Steam Flow (bar)',        screenTest.steam_flow],
            ['Refiner Load (Kw)',       screenTest.refiner_load],
            ['Digester Level (Mtr)',   screenTest.digester_level],
            ['Digester Pressure (Bar)',screenTest.digester_pressure],
            ['Refiner Level (Bar)',    screenTest.refiner_level],
            ['Cooking Level (Sec)',    screenTest.cooking_level],
            ['MC Quadra Beam',         screenTest.mc_quadra_beam],
            ['MC Test Lab. QC',        screenTest.mc_test_lab_qc],
          ].map(([label, val]) => (
            <div key={label} style={{ border:'0.5pt solid #ccc', padding:'2.5pt 4pt', fontSize:'7.5pt' }}>
              <div style={{ color:'#666', fontSize:'6.5pt' }}>{label}</div>
              <div style={{ fontWeight:'bold' }}>{val || '—'}</div>
            </div>
          ))}
        </div>
        {meshRows.length > 0 && (
          <table style={{ width:'60%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Mesh Size','Weight Sample (g)','Weight Distribution %','Specification'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meshRows.map((r, i) => (
                <tr key={i}>
                  <td style={TDL}>{r.mesh_size}</td>
                  <td style={TD}>{fmt(r.weight_sample)}</td>
                  <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{r.weight_dist ? `${r.weight_dist}%` : '—'}</td>
                  <td style={TD}>{r.spec}</td>
                </tr>
              ))}
              <tr style={{ background:'#f0faf6', fontWeight:'bold' }}>
                <td style={TDL}>TOTAL</td>
                <td style={TD}>{meshRows.reduce((s,r) => s+(parseFloat(r.weight_sample)||0),0).toFixed(3)}</td>
                <td style={{...TD, color:'#1a7a60'}}>100%</td>
                <td style={TD}>100%</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* ── F. Thickness & Density Distribution ───────────────── */}
      {thickDens.length > 0 && (
        <div className="print-avoid-break">
          <SecTitle letter="F" title="Thickness and Density Distribution" />
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Time','OD Glue','Fibre MC','Set Weight','Target Density','Avg Density',
                  'Target Thick','Min Thick','Max Thick','Avg Thick','Length Board','Width Board'].map(h => (
                  <th key={h} style={{...TH, fontSize:'7pt'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {thickDens.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{r.nomor}</td>
                  <td style={TD}>{r.time_sampling || '—'}</td>
                  {['od_glue','fibre_mc','set_weight','target_density','avg_density',
                    'target_thick','min_thick','max_thick','avg_thick','length_board','width_board'].map(k => (
                    <td key={k} style={TD}>{fmt(r[k],2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── G. Press & Process Parameters ────────────────────── */}
      {pressParams.length > 0 && (
        <div className="print-avoid-break">
          <SecTitle letter="G" title="Press & Process Parameters" />
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{...TH, fontSize:'7pt'}} rowSpan={2}>No</th>
                <th style={{...TH, fontSize:'7pt'}} rowSpan={2}>Temp. Inlet (°C)</th>
                <th style={{...TH, fontSize:'7pt'}} rowSpan={2}>Speed Press</th>
                <th style={{...TH, fontSize:'7pt'}} colSpan={3}>Density Profil</th>
                <th style={{...TH, fontSize:'7pt'}} colSpan={2}>Internal Bonding</th>
                <th style={{...TH, fontSize:'7pt'}} colSpan={4}>Heating</th>
              </tr>
              <tr>
                {['Max Density','Min Core','Ratio','Average','Minimum','H1','H2','H3','H4'].map(h => (
                  <th key={h} style={{...TH, fontSize:'7pt'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pressParams.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{r.nomor}</td>
                  {['temp_inlet_press','speed_press','max_density','min_core_density','ratio_dens',
                    'ib_average','ib_minimum','heating_1','heating_2','heating_3','heating_4'].map(k => (
                    <td key={k} style={TD}>{fmt(r[k],2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── H. Board MC, Physical Test, Swelling & Absorption ── */}
      <div className="print-page-break" />
      <div className="print-avoid-break">
        <SecTitle letter="H" title="Board MC, Physical Test, Swelling & Absorption" />
        <div style={{ fontSize:'7pt', color:'#555', marginBottom:'3pt' }}>
          MC% = ((W.Before−W.After)/W.After)×100 &nbsp;|&nbsp;
          Absorption% = ((W.24h−W.0h)/W.0h)×100 &nbsp;|&nbsp;
          Swelling% = ((T.24h−T.0h)/T.0h)×100
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'7.5pt' }}>
          <thead>
            <tr>
              <th style={{...TH, fontSize:'7pt', background:'#1a7a60', color:'white'}} colSpan={4}>
                Board MC : Oven (24h, 105°C)
              </th>
              <th style={{...TH, fontSize:'7pt', background:'#1a7a60', color:'white'}} colSpan={3}>Physical Test</th>
              <th style={{...TH, fontSize:'7pt', background:'#1a7a60', color:'white'}} colSpan={7}>
                Swelling & Absorption in water (24h, 20°C){sec8.swelling_jam ? `, Jam: ${sec8.swelling_jam}` : ''}
              </th>
            </tr>
            <tr>
              {['No','Weight Before (g)','Weight After (g)','MC %',
                'SH Face (N)','SH Edge (N)','Geltime Sec',
                'No','Weight (0h) g','Thick (0h) mm','Weight (24h) g','Thick (24h) mm','Absorption %','Swelling %'].map(h => (
                <th key={h} style={{...TH, fontSize:'7pt'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length:5}, (_,i) => {
              const mc = boardMc[i] ?? { no: i+1 };
              const sw = swelling[i] ?? { no: i+1 };
              return (
                <tr key={i}>
                  <td style={TD}>{mc.no ?? i+1}</td>
                  <td style={TD}>{fmt(mc.weight_before)}</td>
                  <td style={TD}>{fmt(mc.weight_after)}</td>
                  <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{mc.mc_pct ? `${mc.mc_pct}%` : '—'}</td>
                  <td style={TD}>{fmt(mc.sh_face)}</td>
                  <td style={TD}>{fmt(mc.sh_edge)}</td>
                  {i === 0 && (
                    <td style={{...TD, fontWeight:'bold'}} rowSpan={5}>{fmt(sec8.geltime)}</td>
                  )}
                  <td style={TD}>{sw.no ?? i+1}</td>
                  <td style={TD}>{fmt(sw.weight_0h)}</td>
                  <td style={TD}>{fmt(sw.thick_0h)}</td>
                  <td style={TD}>{fmt(sw.weight_24h)}</td>
                  <td style={TD}>{fmt(sw.thick_24h)}</td>
                  <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{sw.absorption_pct ? `${sw.absorption_pct}%` : '—'}</td>
                  <td style={{...TD, fontWeight:'bold', color:'#1a7a60'}}>{sw.swelling_pct ? `${sw.swelling_pct}%` : '—'}</td>
                </tr>
              );
            })}
            <tr style={{ background:'#f0faf6', fontWeight:'bold' }}>
              <td style={TD} colSpan={2}/>
              <td style={{...TDL, fontSize:'7pt', fontWeight:'bold', color:'#1a7a60'}}>Average</td>
              <td style={{...TD, color:'#1a7a60'}}>{avgOf(boardMc,'mc_pct')}%</td>
              <td style={{...TD, color:'#1a7a60'}}>{avgOf(boardMc,'sh_face')}</td>
              <td style={{...TD, color:'#1a7a60'}}>{avgOf(boardMc,'sh_edge')}</td>
              <td style={TD} colSpan={6}/>
              <td style={{...TD, color:'#1a7a60'}}>{avgOf(swelling,'absorption_pct')}%</td>
              <td style={{...TD, color:'#1a7a60'}}>{avgOf(swelling,'swelling_pct')}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── I. Formaldehyde Emission Test ─────────────────────── */}
      <div className="print-avoid-break">
        <SecTitle letter="I" title="Formaldehyde Emission Test" />
        <div style={{ fontSize:'7pt', color:'#555', marginBottom:'3pt' }}>
          ASTM D 6007 (ppm) = JIS A 1460 (mg/l) ÷ 7.214
        </div>
        <div style={{ display:'flex', gap:'8pt' }}>
          {[
            ['JIS A 1460 (mg/l)', sec8.emission_jis ? `${sec8.emission_jis} mg/l` : '—'],
            ['ASTM D 6007 (ppm)', sec8.emission_astm ? `${sec8.emission_astm} ppm` : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ border:'0.5pt solid #ccc', padding:'3pt 6pt', fontSize:'8.5pt', flex:1 }}>
              <div style={{ color:'#555', fontSize:'7pt' }}>{label}</div>
              <div style={{ fontWeight:'bold', color:'#1a7a60', fontSize:'10pt' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── J. MOR/MOE & Surface Soundness ───────────────────── */}
      {(morMoe.length > 0 || surfSound.length > 0) && (
        <div className="print-avoid-break">
          <SecTitle letter="J" title="Modulus of Rupture, Surface Soundness" />
          <div style={{ display:'flex', gap:'8pt' }}>
            {morMoe.length > 0 && (
              <table style={{ borderCollapse:'collapse', flex:1 }}>
                <thead>
                  <tr>
                    {['No','MOE','MOR'].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {morMoe.map((r, i) => (
                    <tr key={i}>
                      <td style={TD}>{r.no}</td>
                      <td style={TD}>{fmt(r.moe)}</td>
                      <td style={TD}>{fmt(r.mor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {surfSound.length > 0 && (
              <table style={{ borderCollapse:'collapse', width:'200pt' }}>
                <thead>
                  <tr>
                    {['No','Surface Soundness Value'].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {surfSound.map((r, i) => (
                    <tr key={i}>
                      <td style={TD}>{r.no}</td>
                      <td style={TD}>{fmt(r.value)}</td>
                    </tr>
                  ))}
                  <tr style={{ background:'#f0faf6', fontWeight:'bold' }}>
                    <td style={TD}>Avg</td>
                    <td style={{...TD, color:'#1a7a60'}}>{avgOf(surfSound,'value')}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </PrintLayout>
  );
};

export default PrintQcLabShift;
