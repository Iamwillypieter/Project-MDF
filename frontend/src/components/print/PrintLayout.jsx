/**
 * PrintLayout — Wrapper dokumen cetak formal A4
 *
 * Menghasilkan layout kertas pabrik dengan:
 *   - Header: logo teks perusahaan, judul form, metadata
 *   - Body: konten laporan (children)
 *   - Footer: area remarks + 3 kolom tanda tangan
 *
 * Props:
 *   title        : judul form laporan (mis. "Quality Shift Report")
 *   subtitle     : sub-judul (mis. "IN-PROCESS TESTING")
 *   docNo        : nomor dokumen / ID (mis. "#123")
 *   date         : tanggal laporan (string sudah diformat)
 *   meta         : array of { label, value } untuk baris info header
 *   remarks      : string catatan (footer)
 *   signatories  : array[3] of { role, name } untuk kolom tanda tangan
 *   orientation  : 'landscape' | 'portrait' (default 'landscape')
 *   children     : konten body laporan
 */
const PrintLayout = ({
  title       = 'Laporan',
  subtitle    = '',
  docNo       = '',
  date        = '',
  meta        = [],
  remarks     = '',
  signatories = [],
  orientation = 'landscape',
  children,
}) => {
  const defaultSign = [
    { role: 'Prepared by / Tester', name: '' },
    { role: 'Checked by / QC Leader', name: '' },
    { role: 'Approved by / Manager', name: '' },
  ];
  const signs = signatories.length > 0 ? signatories : defaultSign;

  return (
    <div
      className="print-document"
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '9pt',
        color: '#000',
        background: 'white',
        width: '100%',
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6pt' }}>
        <tbody>
          <tr>
            {/* Nama perusahaan + judul */}
            <td style={{ padding: '4pt 6pt', border: '0.5pt solid #333', width: '60%' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1a5c47' }}>
                PT CANANG INDAH INDUSTRI PARTICLE BOARD
              </div>
              <div style={{ fontSize: '8pt', color: '#555' }}>
                MDF Division — Quality &amp; Production Control
              </div>
              <div style={{ marginTop: '4pt', fontSize: '12pt', fontWeight: 'bold', color: '#000' }}>
                {title}
              </div>
              {subtitle && (
                <div style={{ fontSize: '8pt', color: '#444', letterSpacing: '0.5pt' }}>
                  {subtitle}
                </div>
              )}
            </td>

            {/* Tabel metadata kanan */}
            <td style={{ padding: '0', border: '0.5pt solid #333', width: '40%', verticalAlign: 'top' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2.5pt 5pt', borderBottom: '0.5pt solid #ccc', color: '#555', width: '40%' }}>
                      No. Dokumen
                    </td>
                    <td style={{ padding: '2.5pt 5pt', borderBottom: '0.5pt solid #ccc', fontWeight: 'bold' }}>
                      {docNo}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2.5pt 5pt', borderBottom: '0.5pt solid #ccc', color: '#555' }}>
                      Tanggal
                    </td>
                    <td style={{ padding: '2.5pt 5pt', borderBottom: '0.5pt solid #ccc', fontWeight: 'bold' }}>
                      {date}
                    </td>
                  </tr>
                  {meta.map((m, i) => (
                    <tr key={i}>
                      <td style={{
                        padding: '2.5pt 5pt',
                        borderBottom: i < meta.length - 1 ? '0.5pt solid #ccc' : 'none',
                        color: '#555',
                      }}>
                        {m.label}
                      </td>
                      <td style={{
                        padding: '2.5pt 5pt',
                        borderBottom: i < meta.length - 1 ? '0.5pt solid #ccc' : 'none',
                        fontWeight: 'bold',
                      }}>
                        {m.value || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── BODY (konten laporan) ────────────────────────────────────── */}
      <div style={{ marginBottom: '8pt' }}>
        {children}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6pt' }}>
        <tbody>
          {/* Area Remarks */}
          <tr>
            <td
              colSpan={signs.length}
              style={{ padding: '4pt 6pt', border: '0.5pt solid #333', verticalAlign: 'top' }}
            >
              <div style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#555', marginBottom: '2pt' }}>
                REMARKS / CATATAN
              </div>
              <div style={{ minHeight: '20pt', fontSize: '8.5pt', whiteSpace: 'pre-wrap' }}>
                {remarks || ' '}
              </div>
            </td>
          </tr>

          {/* Kolom Tanda Tangan */}
          <tr>
            {signs.map((s, i) => (
              <td
                key={i}
                style={{
                  padding: '4pt 6pt',
                  border: '0.5pt solid #333',
                  textAlign: 'center',
                  width: `${100 / signs.length}%`,
                }}
              >
                <div style={{ fontSize: '7.5pt', color: '#555', marginBottom: '2pt' }}>
                  {s.role}
                </div>
                {/* Area tanda tangan */}
                <div style={{ height: '32pt', borderBottom: '0.5pt solid #999', margin: '4pt 10pt' }} />
                <div style={{ fontSize: '8pt', fontWeight: 'bold' }}>
                  {s.name || '( __________________ )'}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Footer dokumen — timestamp cetak */}
      <div style={{ marginTop: '4pt', fontSize: '7pt', color: '#aaa', textAlign: 'right' }}>
        Dicetak: {new Date().toLocaleString('id-ID', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </div>
    </div>
  );
};

export default PrintLayout;
