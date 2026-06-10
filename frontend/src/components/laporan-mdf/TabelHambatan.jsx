/**
 * TabelHambatan
 * Controlled component untuk tabel hambatan dinamis.
 * Props: rows (array), onChange (fn), onAddRow (fn), onDeleteRow (fn), disabled (bool)
 *
 * Setiap baris = { dari, sampai, keterangan, bagian, dilaporkan_oleh }
 * Disimpan sebagai JSONB di PostgreSQL — tetap 1 dokumen utuh per laporan.
 */
const KOLOM = [
  { key: 'dari',             label: 'Dari',             placeholder: '08:00', type: 'time'   },
  { key: 'sampai',           label: 'Sampai',           placeholder: '09:00', type: 'time'   },
  { key: 'keterangan',       label: 'Keterangan',       placeholder: 'Deskripsi hambatan', type: 'text' },
  { key: 'bagian',           label: 'Bagian',           placeholder: 'Nama bagian',        type: 'text' },
  { key: 'dilaporkan_oleh',  label: 'Dilaporkan Oleh',  placeholder: 'Nama pelapor',       type: 'text' },
];

const TabelHambatan = ({ rows, onChange, onAddRow, onDeleteRow, disabled }) => {
  return (
    <div className="mt-6">
      {/* Header tabel */}
      <div className="bg-green-600 text-white text-center text-sm font-bold py-2 rounded-t-lg tracking-wide">
        HAMBATAN
      </div>

      <div className="border border-slate-200 rounded-b-lg overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-50">
              {KOLOM.map(col => (
                <th
                  key={col.key}
                  className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-green-800"
                >
                  {col.label}
                </th>
              ))}
              <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-green-800 w-16">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={KOLOM.length + 1}
                  className="text-center text-slate-400 py-6 text-xs italic"
                >
                  Belum ada hambatan. Klik "+ Tambah Baris" untuk menambahkan.
                </td>
              </tr>
            )}

            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {KOLOM.map(col => (
                  <td key={col.key} className="border border-slate-200 px-2 py-1">
                    {/* Controlled input per sel */}
                    <input
                      type={col.type}
                      value={row[col.key]}
                      onChange={e => onChange(rowIdx, col.key, e.target.value)}
                      placeholder={col.type !== 'time' ? col.placeholder : undefined}
                      disabled={disabled}
                      className="w-full border-0 bg-transparent text-slate-800 text-xs
                                 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                                 disabled:cursor-not-allowed"
                    />
                  </td>
                ))}
                {/* Tombol hapus baris */}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Tombol tambah baris */}
      <button
        type="button"
        onClick={onAddRow}
        disabled={disabled}
        className="mt-3 flex items-center gap-1 text-sm text-green-700 font-medium
                   hover:text-green-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-lg leading-none">+</span>
        Tambah Baris
      </button>
    </div>
  );
};

export default TabelHambatan;
