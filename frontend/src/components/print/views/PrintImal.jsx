/**
 * PrintImal — Print view Laporan IMAL (Pemakaian Bahan Baku)
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

const PrintImal = ({ data }) => {
  if (!data) return null;
  const shifts = Array.isArray(data.shifts) ? data.shifts : [];

  return (
    <PrintLayout
      title="Laporan IMAL — Pemakaian Bahan Baku"
      subtitle="IMAL MATERIAL CONSUMPTION REPORT"
      docNo={`#${data.id}`}
      date={formatDateTime(data.created_at)}
      meta={[{ label:'Operator', value: data.operator_name }]}
      signatories={[
        { role:'Prepared by / Operator', name: data.operator_name || '' },
        { role:'Checked by / Supervisor', name:'' },
        { role:'Approved by / Manager', name:'' },
      ]}
    >
      {shifts.length > 0 && (
        <div className="print-avoid-break">
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            DATA PEMAKAIAN BAHAN BAKU PER SHIFT
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Shift','Glue Awal (kg)','Glue Akhir (kg)','Wax Awal (kg)','Wax Akhir (kg)',
                  'Dilaporkan Oleh','Status Periksa','Diperiksa Oleh'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((s, i) => (
                <tr key={i}>
                  <td style={TD}>{i+1}</td>
                  <td style={TD}>{s.shift || '—'}</td>
                  <td style={TD}>{n(s.glue_awal)}</td>
                  <td style={TD}>{n(s.glue_akhir)}</td>
                  <td style={TD}>{n(s.wax_awal)}</td>
                  <td style={TD}>{n(s.wax_akhir)}</td>
                  <td style={TD}>{s.dilaporkan_operator || '—'}</td>
                  <td style={{...TD,
                    color: s.diperiksa_status === 'verified' ? '#1a7a60' : '#b45309',
                    fontWeight: 'bold',
                  }}>
                    {s.diperiksa_status === 'verified' ? '✓ Verified' : 'Pending'}
                  </td>
                  <td style={TD}>{s.diperiksa_oleh || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintLayout>
  );
};

export default PrintImal;
