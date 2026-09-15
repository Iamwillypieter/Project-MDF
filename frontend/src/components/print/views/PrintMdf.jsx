/**
 * PrintMdf — Print view Laporan Produksi MDF
 * Menampilkan parameter KIRI & KANAN + tabel hambatan
 */
import PrintLayout from '../PrintLayout';

const formatDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const n = (v, dec = 3) => {
  const x = parseFloat(v);
  return isNaN(x) || v == null || v === '' ? '—' : x.toFixed(dec);
};

const TH = { border:'0.5pt solid #333', background:'#d4edda', padding:'3pt 4pt', textAlign:'center', fontSize:'7.5pt', fontWeight:'bold' };
const TD = { border:'0.5pt solid #333', padding:'2.5pt 4pt', textAlign:'center', fontSize:'8pt' };
const TDL = { ...TD, textAlign:'left' };

const SideTable = ({ title, d }) => (
  <div style={{ flex:1 }}>
    <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
      {title}
    </div>
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr>
          <th style={{...TH, textAlign:'left'}}>Parameter</th>
          <th style={TH}>Nilai</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['Raw Thickness (mm)',    n(d.kiri_raw_thickness  || d.kanan_raw_thickness)],
          ['Fin. Thickness (mm)',   n(d.kiri_fin_thickness  || d.kanan_fin_thickness)],
          ['Good Board (lbr)',      n(d.kiri_good_board     || d.kanan_good_board, 0)],
          ['M³ Good Board',        n(d.kiri_m3_goodboard   || d.kanan_m3_goodboard)],
          ['Total Reject (lbr)',   n(d.kiri_total_reject   || d.kanan_total_reject, 0)],
          ['M³ Reject',            n(d.kiri_m3_reject      || d.kanan_m3_reject)],
          ['Total Board (lbr)',    n(d.kiri_total_board    || d.kanan_total_board, 0)],
          ['Total Board M³',       n(d.kiri_total_board_m3 || d.kanan_total_board_m3)],
          ['Glue Mix (kg)',         n(d.kiri_gluemix        || d.kanan_gluemix)],
          ['Paraffin (kg)',         n(d.kiri_paraffin       || d.kanan_paraffin)],
          ['Fibre (ton)',           n(d.kiri_fibre          || d.kanan_fibre)],
          ['Wood (ton)',            n(d.kiri_wood           || d.kanan_wood)],
          ['Jenis Board',          d.kiri_jenis            || d.kanan_jenis || '—'],
        ].map(([label, val]) => (
          <tr key={label}>
            <td style={TDL}>{label}</td>
            <td style={{...TD, fontWeight:'bold'}}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PrintMdf = ({ data }) => {
  if (!data) return null;
  const hambatan = Array.isArray(data.hambatan) ? data.hambatan : [];

  // Pisahkan data kiri dan kanan
  const kiri = {
    kiri_raw_thickness: data.kiri_raw_thickness, kiri_fin_thickness: data.kiri_fin_thickness,
    kiri_good_board: data.kiri_good_board, kiri_m3_goodboard: data.kiri_m3_goodboard,
    kiri_total_reject: data.kiri_total_reject, kiri_m3_reject: data.kiri_m3_reject,
    kiri_total_board: data.kiri_total_board, kiri_total_board_m3: data.kiri_total_board_m3,
    kiri_gluemix: data.kiri_gluemix, kiri_paraffin: data.kiri_paraffin,
    kiri_fibre: data.kiri_fibre, kiri_wood: data.kiri_wood, kiri_jenis: data.kiri_jenis,
  };
  const kanan = {
    kanan_raw_thickness: data.kanan_raw_thickness, kanan_fin_thickness: data.kanan_fin_thickness,
    kanan_good_board: data.kanan_good_board, kanan_m3_goodboard: data.kanan_m3_goodboard,
    kanan_total_reject: data.kanan_total_reject, kanan_m3_reject: data.kanan_m3_reject,
    kanan_total_board: data.kanan_total_board, kanan_total_board_m3: data.kanan_total_board_m3,
    kanan_gluemix: data.kanan_gluemix, kanan_paraffin: data.kanan_paraffin,
    kanan_fibre: data.kanan_fibre, kanan_wood: data.kanan_wood, kanan_jenis: data.kanan_jenis,
  };

  return (
    <PrintLayout
      title="Laporan Produksi MDF"
      subtitle="PRODUCTION REPORT"
      docNo={`#${data.id}`}
      date={formatDateTime(data.created_at)}
      meta={[
        { label: 'Operator', value: data.operator_name },
      ]}
      signatories={[
        { role: 'Prepared by / Operator', name: data.operator_name || '' },
        { role: 'Checked by / Supervisor', name: '' },
        { role: 'Approved by / Manager', name: '' },
      ]}
    >
      {/* Parameter KIRI dan KANAN berdampingan */}
      <div style={{ display:'flex', gap:'8pt', marginBottom:'8pt' }}>
        <SideTable title="PARAMETER KIRI" d={kiri} />
        <SideTable title="PARAMETER KANAN" d={kanan} />
      </div>

      {/* Tabel Hambatan */}
      {hambatan.length > 0 && (
        <div className="print-avoid-break">
          <div style={{ background:'#1a7a60', color:'white', padding:'2pt 5pt', fontSize:'8pt', fontWeight:'bold', marginBottom:'2pt' }}>
            HAMBATAN / GANGGUAN PRODUKSI
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['No','Dari (Jam)','Sampai (Jam)','Keterangan','Bagian','Dilaporkan Oleh'].map(h => (
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

export default PrintMdf;
