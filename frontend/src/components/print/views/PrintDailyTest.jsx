/**
 * PrintDailyTest — Print view Daily Test Report Sanding Line
 */
import PrintLayout from '../PrintLayout';

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
};
const n = (v, dec = 3) => { const x = parseFloat(v); return isNaN(x) || v == null || v === '' ? '—' : x.toFixed(dec); };
const avgOf = (arr, key) => {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  const vals = arr.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
  return vals.length ? (vals.reduce((s,v) => s+v, 0)/vals.length).toFixed(3) : '—';
};

const TH = { border:'0.5pt solid #333', background:'#d4edda', padding:'3pt 4pt', textAlign:'center', fontSize:'7.5pt', fontWeight:'bold' };
const TD = { border:'0.5pt solid #333', padding:'2.5pt 4pt', textAlign:'center', fontSize:'8pt' };
const TDL = { ...TD, textAlign:'left' };

const SecTitle = ({ title }) => (
  <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginTop:'5pt', marginBottom:'2pt' }}>
    {title}
  </div>
);

const DataTable = ({ title, rows, columns }) => {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="print-avoid-break">
      <SecTitle title={title} />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={TH}>No</th>
            {columns.map(c => <th key={c.key} style={TH}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={TD}>{i+1}</td>
              {columns.map(c => (
                <td key={c.key} style={c.left ? TDL : TD}>{c.fmt ? c.fmt(r[c.key]) : (r[c.key] || '—')}</td>
              ))}
            </tr>
          ))}
          {/* Average row */}
          <tr style={{ background:'#f0faf6', fontWeight:'bold' }}>
            <td colSpan={2} style={{...TDL, color:'#1a7a60', fontSize:'7.5pt'}}>Average</td>
            {columns.slice(1).map(c => (
              <td key={c.key} style={{...TD, color:'#1a7a60'}}>
                {c.fmt ? '' : avgOf(rows, c.key)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const PrintDailyTest = ({ data }) => {
  if (!data) return null;

  const boardDensity  = Array.isArray(data.board_density)  ? data.board_density  : [];
  const physicalTest  = Array.isArray(data.physical_test)  ? data.physical_test  : [];
  const boardMc       = Array.isArray(data.board_mc)       ? data.board_mc       : [];
  const swelling      = Array.isArray(data.swelling)       ? data.swelling       : [];
  const sortirUlang   = Array.isArray(data.sortir_ulang)   ? data.sortir_ulang   : [];

  return (
    <PrintLayout
      title="Daily Test Report — Sanding Line MDF"
      subtitle="DAILY QUALITY TEST REPORT"
      docNo={`#${data.id}`}
      date={formatDate(data.date_sanding)}
      meta={[
        { label:'Tanggal Sanding',    value: formatDate(data.date_sanding) },
        { label:'Tanggal Produksi',   value: formatDate(data.date_production) },
        { label:'Shift / Group',      value: data.shift_group },
        { label:'Tester',             value: data.tester },
        { label:'Shift',              value: data.shift },
        { label:'Time',               value: data.time },
        { label:'Board Thickness',    value: data.board_thickness },
        { label:'Operator',           value: data.operator_name },
      ]}
      remarks={data.remarks || ''}
      signatories={[
        { role:'Prepared by / Tester', name: data.tester || '' },
        { role:'Checked by / QC Leader', name:'' },
        { role:'Approved by / Manager', name:'' },
      ]}
    >
      {/* Board Density */}
      <DataTable
        title="Board Density"
        rows={boardDensity}
        columns={[
          { key:'thickness',      label:'Thickness (mm)',   fmt: v => n(v) },
          { key:'weight',         label:'Weight (g)',        fmt: v => n(v) },
          { key:'density',        label:'Density (kg/m³)',   fmt: v => n(v,2) },
          { key:'keterangan',     label:'Keterangan',        left:true },
        ]}
      />

      {/* Physical Test */}
      <DataTable
        title="Physical Test"
        rows={physicalTest}
        columns={[
          { key:'sample',         label:'Sample',            left:true },
          { key:'thickness',      label:'Thickness (mm)',    fmt: v => n(v) },
          { key:'density',        label:'Density (kg/m³)',   fmt: v => n(v,2) },
          { key:'mc',             label:'MC (%)',            fmt: v => n(v,2) },
          { key:'keterangan',     label:'Keterangan',        left:true },
        ]}
      />

      {/* Board MC */}
      <DataTable
        title="Board Moisture Content"
        rows={boardMc}
        columns={[
          { key:'weight_before',  label:'Weight Before (g)', fmt: v => n(v) },
          { key:'weight_after',   label:'Weight After (g)',  fmt: v => n(v) },
          { key:'mc_pct',         label:'MC (%)',            fmt: v => v ? `${v}%` : '—' },
        ]}
      />

      {/* Swelling */}
      <DataTable
        title="Swelling & Absorption (24h, 20°C)"
        rows={swelling}
        columns={[
          { key:'weight_0h',      label:'Weight (0h) g',      fmt: v => n(v) },
          { key:'thick_0h',       label:'Thick (0h) mm',      fmt: v => n(v) },
          { key:'weight_24h',     label:'Weight (24h) g',     fmt: v => n(v) },
          { key:'thick_24h',      label:'Thick (24h) mm',     fmt: v => n(v) },
          { key:'absorption_pct', label:'Absorption (%)',      fmt: v => v ? `${v}%` : '—' },
          { key:'swelling_pct',   label:'Swelling (%)',        fmt: v => v ? `${v}%` : '—' },
        ]}
      />

      {/* Sortir Ulang */}
      {sortirUlang.length > 0 && (
        <div className="print-avoid-break">
          <SecTitle title="Sortir Ulang" />
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Grade','Pcs','M³','Keterangan'].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortirUlang.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{i+1}</td>
                  <td style={TDL}>{r.grade || '—'}</td>
                  <td style={TD}>{r.pcs || '—'}</td>
                  <td style={TD}>{n(r.m3)}</td>
                  <td style={TDL}>{r.keterangan || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintLayout>
  );
};

export default PrintDailyTest;
