/**
 * PrintChipper — Print view Laporan Chipper MDF
 */
import PrintLayout from '../PrintLayout';

const formatDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
};
const n = (v, dec = 2) => { const x = parseFloat(v); return isNaN(x) || v == null || v === '' ? '—' : x.toFixed(dec); };

const TH = { border:'0.5pt solid #333', background:'#d4edda', padding:'3pt 4pt', textAlign:'center', fontSize:'7.5pt', fontWeight:'bold' };
const TD = { border:'0.5pt solid #333', padding:'2.5pt 4pt', textAlign:'center', fontSize:'8pt' };
const TDL = { ...TD, textAlign:'left' };

const PrintChipper = ({ data }) => {
  if (!data) return null;
  const dataLog  = Array.isArray(data.data_log)  ? data.data_log  : [];
  const hambatan = Array.isArray(data.hambatan)   ? data.hambatan  : [];

  return (
    <PrintLayout
      title="Laporan Chipper MDF"
      subtitle="CHIPPER PRODUCTION REPORT"
      docNo={`#${data.id}`}
      date={formatDateTime(data.created_at)}
      meta={[{ label:'Operator', value: data.operator_name }]}
      signatories={[
        { role:'Prepared by / Operator', name: data.operator_name || '' },
        { role:'Checked by / Supervisor', name:'' },
        { role:'Approved by / Manager', name:'' },
      ]}
    >
      {/* Data Log */}
      {dataLog.length > 0 && (
        <div className="print-avoid-break">
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            DATA LOG CHIPPER
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Shift','Log Rambung (ton)','Bungker Jam','Bungker 201','Bungker 202','BBM Barkmill','Keterangan'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataLog.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{i+1}</td>
                  <td style={TD}>{r.shift || '—'}</td>
                  <td style={TD}>{n(r.log_rambung)}</td>
                  <td style={TD}>{n(r.bungker_jam)}</td>
                  <td style={TD}>{n(r.bungker_201)}</td>
                  <td style={TD}>{n(r.bungker_202)}</td>
                  <td style={TD}>{n(r.bahan_bakar_barkmill)}</td>
                  <td style={TDL}>{r.keterangan || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hambatan */}
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
                  <td style={TD}>{i+1}</td>
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

export default PrintChipper;
