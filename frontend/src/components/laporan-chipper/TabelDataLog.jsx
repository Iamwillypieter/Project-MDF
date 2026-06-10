/**
 * TabelDataLog — Controlled component
 * Bagian atas form Laporan Chipper MDF.
 * Kelola sebagai array of objects karena strukturnya berupa baris tabel input.
 *
 * Props: rows, onChange, onAddRow, onDeleteRow, disabled
 *
 * Setiap baris = {
 *   shift, log_rambung, bungker_jam, bungker_201,
 *   bungker_202, bahan_bakar_barkmill, keterangan
 * }
 */
const TabelDataLog = ({ rows, onChange, onAddRow, onDeleteRow, disabled }) => {
  return (
    <div>
      {/* Header */}
      <div className="bg-slate-700 text-white text-center text-sm font-bold py-2 rounded-t-lg tracking-wide">
        DATA LOG & BUNGKER
      </div>

      <div className="border border-slate-200 rounded-b-lg overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-left whitespace-nowrap">
                Shift / Group
              </th>
              <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-left whitespace-nowrap">
                Log Rambung (Kg)
              </th>
              {/* Group header: Kondisi Bungker Pada */}
              <th
                colSpan={3}
                className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap"
              >
                Kondisi Bungker Pada
              </th>
              <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-left whitespace-nowrap">
                Bahan Bakar Barkmill
              </th>
              <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-left whitespace-nowrap">
                Keterangan
              </th>
              <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 text-center w-14">
                Aksi
              </th>
            </tr>

            {/* Sub-header Kondisi Bungker */}
            <tr className="bg-slate-50">
              <th className="border border-slate-200 px-2 py-1" colSpan={2} />
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">
                Jam
              </th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">
                201
              </th>
              <th className="border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 text-center">
                202
              </th>
              <th className="border border-slate-200 px-2 py-1" colSpan={3} />
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-slate-400 py-6 text-xs italic"
                >
                  Belum ada data. Klik "+ Tambah Baris" untuk menambahkan.
                </td>
              </tr>
            )}

            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>

                {/* Shift/Group — text input */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    value={row.shift}
                    onChange={e => onChange(rowIdx, 'shift', e.target.value)}
                    disabled={disabled}
                    placeholder="Shift/Group"
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

                {/* Log Rambung */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number" min="0" step="any"
                    value={row.log_rambung}
                    onChange={e => onChange(rowIdx, 'log_rambung', e.target.value)}
                    disabled={disabled}
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

                {/* Bungker Jam */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="time"
                    value={row.bungker_jam}
                    onChange={e => onChange(rowIdx, 'bungker_jam', e.target.value)}
                    disabled={disabled}
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

                {/* Bungker 201 */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number" min="0" step="any"
                    value={row.bungker_201}
                    onChange={e => onChange(rowIdx, 'bungker_201', e.target.value)}
                    disabled={disabled}
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

                {/* Bungker 202 */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number" min="0" step="any"
                    value={row.bungker_202}
                    onChange={e => onChange(rowIdx, 'bungker_202', e.target.value)}
                    disabled={disabled}
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

                {/* Bahan Bakar Barkmill */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    value={row.bahan_bakar_barkmill}
                    onChange={e => onChange(rowIdx, 'bahan_bakar_barkmill', e.target.value)}
                    disabled={disabled}
                    placeholder="Isi jenis/jumlah"
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

                {/* Keterangan */}
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="text"
                    value={row.keterangan}
                    onChange={e => onChange(rowIdx, 'keterangan', e.target.value)}
                    disabled={disabled}
                    placeholder="Keterangan"
                    className="w-full border-0 bg-transparent text-slate-800 text-xs
                               focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
                               disabled:cursor-not-allowed"
                  />
                </td>

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
            ))}
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

export default TabelDataLog;
