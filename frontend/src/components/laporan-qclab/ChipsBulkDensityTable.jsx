/**
 * ChipsBulkDensityTable
 * Tabel 2: Chips Bulk Density (KG/M³)
 *
 * Props:
 *   rows        {Array}    — array of bulk density row objects
 *   disabled    {boolean}
 *   onChange    {fn}       — (rowIdx, key, val) => void
 *   onAddRow    {fn}       — () => void
 *   onDeleteRow {fn}       — (rowIdx) => void
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

const WOOD_SPECIES_OPTIONS = [
  'Acacia',
  'Eucalyptus',
  'Pine',
  'Rubber Wood',
  'Mixed Hardwood',
  'Sengon',
  'Lainnya',
];

const ChipsBulkDensityTable = ({ rows, disabled, onChange, onAddRow, onDeleteRow }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
            C
          </span>
          Chips Bulk Density (KG/M³)
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[650px]">
          <thead>
            <tr className="bg-teal-50 border-b-2 border-teal-200">
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800 w-10">No.</th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Weight of Wet Chips (gr)
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Bulk Density Wet (KG/M³)
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Bulk Density Dry (KG/M³)
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                Species of Wood
              </th>
              <th className="text-center py-2.5 px-2 font-semibold text-teal-800 w-14">
                Hapus
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
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

                  {/* Weight of Wet Chips */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.wet_chips_weight,
                      val => onChange(idx, 'wet_chips_weight', val),
                      disabled
                    )}
                  </td>

                  {/* Bulk Density Wet */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.bulk_density_wet,
                      val => onChange(idx, 'bulk_density_wet', val),
                      disabled
                    )}
                  </td>

                  {/* Bulk Density Dry */}
                  <td className="py-2 px-2">
                    {numInput(
                      row.bulk_density_dry,
                      val => onChange(idx, 'bulk_density_dry', val),
                      disabled
                    )}
                  </td>

                  {/* Species of Wood */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      list={`wood-species-${idx}`}
                      value={row.species_of_wood}
                      onChange={e => onChange(idx, 'species_of_wood', e.target.value)}
                      disabled={disabled}
                      placeholder="Ketik atau pilih..."
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm
                                 focus:ring-1 focus:ring-teal-500 focus:border-teal-500
                                 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <datalist id={`wood-species-${idx}`}>
                      {WOOD_SPECIES_OPTIONS.map(opt => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
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

export default ChipsBulkDensityTable;
