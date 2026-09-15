/**
 * PrintKertasPasir — Print view Laporan Pemakaian Kertas Pasir
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
const n = (v, dec = 0) => { const x = parseFloat(v); return isNaN(x) || v == null || v === '' ? '—' : x.toFixed(dec); };

const TH = { border:'0.5pt solid #333', background:'#d4edda', padding:'3pt 4pt', textAlign:'center', fontSize:'7.5pt', fontWeight:'bold' };
const TD = { border:'0.5pt solid #333', padding:'2.5pt 4pt', textAlign:'center', fontSize:'8pt' };
const TDL = { ...TD, textAlign:'left' };
const TDR = { ...TD, textAlign:'right' };

const PrintKertasPasir = ({ data }) => {
  if (!data) return null;
  const transaksi = Array.isArray(data.transaksi) ? data.transaksi : [];

  // Hitung stok akhir dari transaksi
  let stokBerjalan = 0;

  return (
    <PrintLayout
      title="Laporan Pemakaian Kertas Pasir"
      subtitle="SANDPAPER CONSUMPTION REPORT"
      docNo={`#${data.id}`}
      date={formatDate(data.tanggal)}
      meta={[
        { label:'Tanggal',    value: formatDate(data.tanggal) },
        { label:'Dibuat',     value: formatDateTime(data.created_at) },
        { label:'Operator',   value: data.operator_name },
      ]}
      remarks={data.keterangan || ''}
      signatories={[
        { role:'Prepared by / Operator', name: data.operator_name || '' },
        { role:'Checked by / Supervisor', name:'' },
        { role:'Approved by / Manager', name:'' },
      ]}
    >
      {transaksi.length > 0 && (
        <div className="print-avoid-break">
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            DATA TRANSAKSI PEMAKAIAN KERTAS PASIR
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Jenis / Tipe','Ukuran (Grit)','Masuk (Lembar)','Keluar (Lembar)','Stok Akhir','Keterangan'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transaksi.map((t, i) => {
                const masuk  = parseInt(t.masuk  || t.jumlah_masuk  || 0);
                const keluar = parseInt(t.keluar || t.jumlah_keluar || 0);
                stokBerjalan = stokBerjalan + masuk - keluar;
                return (
                  <tr key={i}>
                    <td style={TD}>{i + 1}</td>
                    <td style={TDL}>{t.jenis || t.tipe || '—'}</td>
                    <td style={TD}>{t.ukuran || t.grit || '—'}</td>
                    <td style={{...TDR, color: masuk > 0 ? '#1a7a60' : '#666'}}>{masuk > 0 ? `+${masuk}` : '—'}</td>
                    <td style={{...TDR, color: keluar > 0 ? '#b45309' : '#666'}}>{keluar > 0 ? `-${keluar}` : '—'}</td>
                    <td style={{...TDR, fontWeight:'bold'}}>{stokBerjalan}</td>
                    <td style={TDL}>{t.keterangan || '—'}</td>
                  </tr>
                );
              })}
              {/* Summary row */}
              <tr style={{ background:'#f0faf6', fontWeight:'bold' }}>
                <td colSpan={3} style={{...TDL, fontSize:'8.5pt'}}>TOTAL TRANSAKSI</td>
                <td style={{...TDR, color:'#1a7a60'}}>
                  +{transaksi.reduce((s,t) => s + (parseInt(t.masuk || t.jumlah_masuk || 0)), 0)}
                </td>
                <td style={{...TDR, color:'#b45309'}}>
                  -{transaksi.reduce((s,t) => s + (parseInt(t.keluar || t.jumlah_keluar || 0)), 0)}
                </td>
                <td style={{...TDR, fontSize:'9pt'}}>{stokBerjalan}</td>
                <td style={TD} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </PrintLayout>
  );
};

export default PrintKertasPasir;
