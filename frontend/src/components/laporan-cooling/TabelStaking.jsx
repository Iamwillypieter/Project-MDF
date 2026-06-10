/**
 * TabelStaking — Controlled component
 * Tabel dinamis baris-per-baris untuk Laporan Cooling Staking.
 *
 * Props: rows, onChange, onAddRow, onDeleteRow, disabled
 *
 * Setiap baris (object):
 *   shift, tgl_produksi, kode_produksi, raw_thickness, no_stack,
 *   grade_a, grade_b, alas,          ← input manual
 *   total_lbr,                        ← derived (readOnly, dihitung saat render)
 *   seksi, kolom, baris,             ← posisi penyimpanan
 *   keterangan
 *
 * Total Lbr = Grade A + Grade B + Alas  (State-Driven Calculation)
 */
const TabelStaking = ({ rows, onChange, onAddRow, onDeleteRow, disabled }) => {

  // Helper input cell — mengurangi repetisi JSX
  const Cell = ({ rowIdx, field, type = 'text', placeholder = '', width = 'w-20' }) => (
    <td className="border border-slate-200 px-1 py-1">
      <input
        type={type}
        value={rows[rowIdx][field] ?? ''}
        onChange={e => onChange(rowIdx, field, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${width} border-0 bg-transparent text-slate-800 text-xs
                   focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                   disabled:cursor-not-allowed`}
      />
    </td>
  );

  return (
    <div>
      {/* Header */}
      <div className="bg-slate-700 text-white text-center text-sm font-bold py-2 rounded-t-lg tracking-wide">
        DATA COOLING STAKING
      </div>

      <div className="border border-slate-200 rounded-b-lg overflow-x-auto">
        <table className="text-sm border-collapse" style={{ minWidth: '1100px' }}>
          <thead>
            {/* Baris 1 — header utama dengan group header */}
            <tr className="bg-slate-100">
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">
                Shift / Group
              </th>
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">
                Tgl Produksi
              </th>
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">
                Kode Produksi
              </th>
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">
                Raw Thickness
              </th>
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">
                No Stack
              </th>
              {/* Group: Jumlah (Lbr) */}
              <th colSpan={4} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                Jumlah (Lbr)
              </th>
              {/* Group: Posisi Penyimpanan */}
              <th colSpan={3} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                Posisi Penyimpanan
              </th>
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">
                Keterangan
              </th>
              <th rowSpan={2} className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center w-10 align-middle">
                Aksi
              </th>
            </tr>

            {/* Baris 2 — sub-header */}
            <tr className="bg-slate-50">
              {/* Sub-header Jumlah */}
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">Grade A</th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">Grade B</th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">Alas</th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-amber-600 text-center">
                Total Lbr <span className="text-[10px] font-normal"></span>
              </th>
              {/* Sub-header Posisi */}
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">Seksi</th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">Kolom</th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">Baris</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center text-slate-400 py-8 text-xs italic">
                  Belum ada data. Klik "+ Tambah Baris" untuk menambahkan.
                </td>
              </tr>
            )}

            {rows.map((row, rowIdx) => {
              // ── Derived state: Total Lbr dihitung saat render, tidak disimpan di state ──
              const gradeA   = parseFloat(row.grade_a)  || 0;
              const gradeB   = parseFloat(row.grade_b)  || 0;
              const alas     = parseFloat(row.alas)     || 0;
              const totalLbr = gradeA + gradeB + alas;
              const totalDisplay = (gradeA || gradeB || alas) ? totalLbr.toString() : '';

              return (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>

                  {/* Shift / Group */}
                  <Cell rowIdx={rowIdx} field="shift" placeholder="Shift/Group" width="w-24" />

                  {/* Tanggal Produksi */}
                  <td className="border border-slate-200 px-1 py-1">
                    <input
                      type="date"
                      value={row.tgl_produksi ?? ''}
                      onChange={e => onChange(rowIdx, 'tgl_produksi', e.target.value)}
                      disabled={disabled}
                      className="w-32 border-0 bg-transparent text-slate-800 text-xs
                                 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                                 disabled:cursor-not-allowed"
                    />
                  </td>

                  {/* Kode Produksi */}
                  <Cell rowIdx={rowIdx} field="kode_produksi" placeholder="Kode" width="w-24" />

                  {/* Raw Thickness */}
                  <Cell rowIdx={rowIdx} field="raw_thickness" type="number" placeholder="0" width="w-20" />

                  {/* No Stack */}
                  <Cell rowIdx={rowIdx} field="no_stack" placeholder="No Stack" width="w-20" />

                  {/* Grade A */}
                  <Cell rowIdx={rowIdx} field="grade_a" type="number" placeholder="0" width="w-16" />

                  {/* Grade B */}
                  <Cell rowIdx={rowIdx} field="grade_b" type="number" placeholder="0" width="w-16" />

                  {/* Alas */}
                  <Cell rowIdx={rowIdx} field="alas" type="number" placeholder="0" width="w-16" />

                  {/* Total Lbr — readOnly, derived */}
                  <td className="border border-slate-200 px-1 py-1">
                    <input
                      type="number"
                      value={totalDisplay}
                      readOnly
                      className="w-16 border-0 bg-amber-50 text-amber-800 text-xs font-semibold
                                 rounded px-1 py-0.5 cursor-default focus:outline-none"
                    />
                  </td>

                  {/* Seksi */}
                  <Cell rowIdx={rowIdx} field="seksi" placeholder="Seksi" width="w-16" />

                  {/* Kolom */}
                  <Cell rowIdx={rowIdx} field="kolom" placeholder="Kolom" width="w-16" />

                  {/* Baris */}
                  <Cell rowIdx={rowIdx} field="baris" placeholder="Baris" width="w-16" />

                  {/* Keterangan */}
                  <Cell rowIdx={rowIdx} field="keterangan" placeholder="Keterangan" width="w-28" />

                  {/* Hapus baris */}
                  <td className="border border-slate-200 px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(rowIdx)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700 text-lg leading-none font-bold
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Hapus baris"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tombol tambah baris */}
      <button
        type="button"
        onClick={onAddRow}
        disabled={disabled}
        className="mt-3 flex items-center gap-1 text-sm text-slate-600 font-medium
                   hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-lg leading-none">+</span>
        Tambah Baris
      </button>
    </div>
  );
};

export default TabelStaking;
