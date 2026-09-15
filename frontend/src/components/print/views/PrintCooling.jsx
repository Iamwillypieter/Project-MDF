/**
 * PrintCooling — Print view Laporan Cooling Staking
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

const PrintCooling = ({ data }) => {
  if (!data) return null;
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <PrintLayout
      title="Laporan Cooling Staking"
      subtitle="COOLING & STAKING REPORT"
      docNo={`#${data.id}`}
      date={formatDateTime(data.created_at)}
      meta={[{ label:'Operator', value: data.operator_name }]}
      signatories={[
        { role:'Prepared by / Operator', name: data.operator_name || '' },
        { role:'Checked by / Supervisor', name:'' },
        { role:'Approved by / Manager', name:'' },
      ]}
    >
      {rows.length > 0 && (
        <div className="print-avoid-break">
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            DATA COOLING STAKING
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Shift','Jam','Tebal (mm)','Panjang (mm)','Lebar (mm)',
                  'Good Board (lbr)','Reject (lbr)','Total (lbr)','Keterangan'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={TD}>{i+1}</td>
                  <td style={TD}>{r.shift || '—'}</td>
                  <td style={TD}>{r.jam || '—'}</td>
                  <td style={TD}>{n(r.tebal)}</td>
                  <td style={TD}>{n(r.panjang, 0)}</td>
                  <td style={TD}>{n(r.lebar, 0)}</td>
                  <td style={TD}>{n(r.good_board, 0)}</td>
                  <td style={TD}>{n(r.reject, 0)}</td>
                  <td style={{...TD, fontWeight:'bold'}}>{n(r.total, 0)}</td>
                  <td style={{ ...TD, textAlign:'left' }}>{r.keterangan || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintLayout>
  );
};

export default PrintCooling;
