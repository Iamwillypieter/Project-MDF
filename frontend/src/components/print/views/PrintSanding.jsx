/**
 * PrintSanding — Print view Laporan Hasil Sanding / Grading MDF
 */
import PrintLayout from '../PrintLayout';

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
};
const formatDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
};
const n = (v, dec = 4) => { const x = parseFloat(v); return isNaN(x) || v == null || v === '' ? '—' : x.toFixed(dec); };

const TH = { border:'0.5pt solid #333', background:'#d4edda', padding:'3pt 4pt', textAlign:'center', fontSize:'7.5pt', fontWeight:'bold' };
const TD = { border:'0.5pt solid #333', padding:'2.5pt 4pt', textAlign:'center', fontSize:'8pt' };
const TDL = { ...TD, textAlign:'left' };
const TDR = { ...TD, textAlign:'right' };

const PrintSanding = ({ data }) => {
  if (!data) return null;

  const grading  = (data.grading && typeof data.grading === 'object') ? data.grading : {};
  const hambatan = Array.isArray(data.hambatan) ? data.hambatan : [];
  const grades   = Object.keys(grading);

  // Hitung total
  const totalPcs = grades.reduce((s, g) => s + (parseInt(grading[g]?.pcs) || 0), 0);
  const totalM3  = grades.reduce((s, g) => s + (parseFloat(grading[g]?.m3) || 0), 0);

  return (
    <PrintLayout
      title="Laporan Hasil Sanding / Grading MDF"
      subtitle="SANDING & GRADING REPORT"
      docNo={`#${data.id}`}
      date={formatDate(data.tanggal_produksi)}
      meta={[
        { label: 'Group',           value: data.group },
        { label: 'Ukuran Tebal',    value: data.ukuran_tebal ? `${data.ukuran_tebal} mm` : '—' },
        { label: 'Tanggal Produksi',value: formatDate(data.tanggal_produksi) },
        { label: 'Dibuat',          value: formatDateTime(data.created_at) },
        { label: 'Operator',        value: data.operator_name },
      ]}
      remarks={data.keterangan || ''}
      signatories={[
        { role:'Prepared by / Operator', name: data.operator_name || '' },
        { role:'Checked by / Supervisor', name:'' },
        { role:'Approved by / Manager', name:'' },
      ]}
    >
      {/* Tabel Grading */}
      {grades.length > 0 && (
        <div className="print-avoid-break">
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            DATA GRADING / SORTIR HASIL SANDING
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>No</th>
                <th style={TH}>Grade</th>
                <th style={{...TH, textAlign:'right'}}>Pcs</th>
                <th style={{...TH, textAlign:'right'}}>M³</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, i) => (
                <tr key={grade}>
                  <td style={TD}>{i + 1}</td>
                  <td style={{...TDL, fontWeight:'bold', textTransform:'uppercase'}}>{grade}</td>
                  <td style={{...TDR, fontWeight:'bold'}}>{parseInt(grading[grade]?.pcs || 0).toLocaleString('id-ID')}</td>
                  <td style={{...TDR, fontWeight:'bold', color:'#1a7a60'}}>{n(grading[grade]?.m3)}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ background:'#f0faf6' }}>
                <td colSpan={2} style={{...TDL, fontWeight:'bold', fontSize:'8.5pt'}}>TOTAL</td>
                <td style={{...TDR, fontWeight:'bold', fontSize:'9pt'}}>{totalPcs.toLocaleString('id-ID')}</td>
                <td style={{...TDR, fontWeight:'bold', fontSize:'9pt', color:'#1a7a60'}}>{totalM3.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tabel Hambatan */}
      {hambatan.length > 0 && (
        <div className="print-avoid-break" style={{ marginTop:'6pt' }}>
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            HAMBATAN / GANGGUAN
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Dari','Sampai','Keterangan','Bagian','Dilaporkan Oleh'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hambatan.map((h, i) => (
                <tr key={i}>
                  <td style={TD}>{i + 1}</td>
                  <td style={TD}>{h.dari || '—'}</td>
                  <td style={TD}>{h.sampai || '—'}</td>
                  <td style={TDL}>{h.keterangan || '—'}</td>
                  <td style={TD}>{h.bagian || '—'}</td>
                  <td style={TD}>{h.dilaporkan_oleh || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintLayout>
  );
};

export default PrintSanding;
