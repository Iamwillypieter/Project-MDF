/**
 * ChipsMoistureTable
 * Tabel 1: Chips Moisture Content & pH
 *
 * Props:
 *   rows       {Array}    — array of moisture row objects
 *   disabled   {boolean}  — disable semua input
 *   onChange   {fn}       — (rowIdx, key, val) => void
 *   onAddRow   {fn}       — () => void
 *   onDeleteRow {fn}      — (rowIdx) => void
 */

const numInput = (value, onChange, disabled, placeholder = '') => (
  <input
    type="number"
    step="0.001"
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder || '0.000'}
    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-right
               focus:ring-1 focus:ring-teal-500 focus:border-teal-500
               disabled:bg-slate-50 disabled:text-slate-400"
  />
);

const ChipsMoistureTable = ({ rows, disabled, onChange, onAddRow, onDeleteRow }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
            B
          </span>
          Chips Moisture Content &amp; pH
        </h2>
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <span className="text-base leading-none">+</span> Tambah Baris
        </button>
      </div>

      {/* Formula note */}
      <div className="mb-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        📐 Rumus MC (%) = <span className="font-mono">((b − (c − a)) / b) × 100</span>
        &nbsp;—&nbsp; a = Container Weight, b = Weight of Wet Chips, c = Cont + Dry Chips
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[700px]">
          <thead>
            <tr className="bg-teal-50 border-b-2 border-teal-200">
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800 w-10">No.</th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Container Weight (gr) [a]
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Weight of Wet Chips (gr) [b]
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Cont + Dry Chips (gr) [c]
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Moisture Content (%)
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800 w-20">
                pH
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800 w-14">
                Hapus
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                  Belum ada data. Klik &ldquo;Tambah Baris&rdquo; untuk menambahkan.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  {/* Nomor */}
                  <td className="py-2 px-2 text-center text-slate-500 font-medium">
                    {row.nomor}
                  </td>

                  {/* Container Weight [a] */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.container_weight,
                      val => onChange(idx, 'container_weight', val),
                      disabled
                    )}
                  </td>

                  {/* Weight of Wet Chips [b] */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.wet_chips_weight,
                      val => onChange(idx, 'wet_chips_weight', val),
                      disabled
                    )}
                  </td>

                  {/* Cont + Dry Chips [c] */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.cont_dry_chips,
                      val => onChange(idx, 'cont_dry_chips', val),
                      disabled
                    )}
                  </td>

                  {/* Moisture Content — auto-calculated, read-only dengan highlight */}
                  <td className="py-2 px-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={row.moisture_content}
                        onChange={e => onChange(idx, 'moisture_content', e.target.value)}
                        disabled={disabled}
                        placeholder="Auto"
                        className="w-full px-2 py-1.5 border border-teal-300 rounded text-sm text-right font-semibold
                                   bg-teal-50 text-teal-800 focus:ring-1 focus:ring-teal-500
                                   disabled:opacity-70"
                      />
                      {row.moisture_content && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-teal-600 font-medium pointer-events-none">
                          %
                        </span>
                      )}
                    </div>
                  </td>

                  {/* pH */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.ph,
                      val => onChange(idx, 'ph', val),
                      disabled,
                      '7.0'
                    )}
                  </td>

                  {/* Hapus */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(idx)}
                      disabled={disabled}
                      className="text-red-400 hover:text-red-600 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Hapus baris"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChipsMoistureTable;
