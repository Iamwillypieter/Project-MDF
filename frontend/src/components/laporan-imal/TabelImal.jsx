/**
 * TabelImal — Controlled component
 * Tabel Pemakaian Bahan Baku / Shift (IMAL)
 *
 * Struktur state per shift-block:
 * {
 *   shift: '',
 *   rows: [
 *     { keterangan: 'Awal',  material: '', glue: '', wax: '' },
 *     { keterangan: 'Pakai', material: '', glue: '', wax: '' },
 *     { keterangan: 'Akhir', material: '', glue: '', wax: '' },
 *   ],
 *   dilaporkan_operator: '',
 *   diperiksa_status: 'pending',
 *   diperiksa_oleh: '',
 *   diperiksa_at: '',
 * }
 *
 * Semua field Material, Glue, Wax diisi manual — tidak ada kalkulasi otomatis.
 */

const inputCls = `w-full border-0 bg-transparent text-slate-800 text-xs
  focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5
  disabled:cursor-not-allowed placeholder-slate-300`;

const TOTAL_COLS = 8;

const TabelImal = ({ shifts, onChange, onShiftChange, onAddShift, onDeleteShift, currentUser, disabled }) => {
  return (
    <div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs border-collapse" style={{ minWidth: '800px' }}>
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Shift</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Keterangan</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Material</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Glue</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Wax</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Dilapor Operator</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold">Diperiksa Shift Leader</th>
              <th className="border border-slate-500 px-3 py-2 text-center font-semibold w-10">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {shifts.length === 0 && (
              <tr>
                <td colSpan={TOTAL_COLS} className="text-center text-slate-400 py-8 italic">
                  Belum ada data. Klik "+ Tambah Shift" untuk menambahkan.
                </td>
              </tr>
            )}

            {shifts.map((block, blockIdx) => {
              const isVerified = block.diperiksa_status === 'verified';
              const rowBg = blockIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
              const rows = Array.isArray(block.rows) ? block.rows : [];

              return (
                <>
                  {rows.map((row, rowIdx) => (
                    <tr key={`${blockIdx}-${rowIdx}`} className={rowBg}>

                      {/* Shift — rowspan=3, hanya render di baris pertama */}
                      {rowIdx === 0 && (
                        <td rowSpan={3} className="border border-slate-200 px-2 py-1 text-center align-middle">
                          <input
                            type="text"
                            value={block.shift}
                            onChange={e => onShiftChange(blockIdx, 'shift', e.target.value)}
                            disabled={disabled}
                            placeholder="Shift"
                            className={`w-20 text-center ${inputCls}`}
                          />
                        </td>
                      )}

                      {/* Keterangan — label statis */}
                      <td className="border border-slate-200 px-3 py-1 font-semibold text-slate-600 whitespace-nowrap">
                        {row.keterangan}
                      </td>

                      {/* Material — input per baris */}
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="text"
                          value={row.material}
                          onChange={e => onChange(blockIdx, rowIdx, 'material', e.target.value)}
                          disabled={disabled}
                          placeholder="Material"
                          className={inputCls}
                        />
                      </td>

                      {/* Glue — input manual */}
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="number"
                          step="any"
                          value={row.glue}
                          onChange={e => onChange(blockIdx, rowIdx, 'glue', e.target.value)}
                          disabled={disabled}
                          placeholder="0"
                          className={inputCls}
                        />
                      </td>

                      {/* Wax — input manual */}
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="number"
                          step="any"
                          value={row.wax}
                          onChange={e => onChange(blockIdx, rowIdx, 'wax', e.target.value)}
                          disabled={disabled}
                          placeholder="0"
                          className={inputCls}
                        />
                      </td>

                      {/* Dilapor Operator — rowspan=3 */}
                      {rowIdx === 0 && (
                        <td rowSpan={3} className="border border-slate-200 px-2 py-1 text-center align-middle">
                          <div className="text-xs text-slate-700 font-medium">
                            {block.dilaporkan_operator || currentUser?.name || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Operator</div>
                        </td>
                      )}

                      {/* Diperiksa Shift Leader — rowspan=3 */}
                      {rowIdx === 0 && (
                        <td rowSpan={3} className="border border-slate-200 px-2 py-1 text-center align-middle">
                          {isVerified ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold
                                               bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ✅ Verified
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1">{block.diperiksa_oleh}</div>
                              <div className="text-[10px] text-slate-400">
                                {block.diperiksa_at
                                  ? new Date(block.diperiksa_at).toLocaleString('id-ID', {
                                      day: '2-digit', month: 'short', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })
                                  : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium
                                             bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                      )}

                      {/* Aksi — rowspan=3 */}
                      {rowIdx === 0 && (
                        <td rowSpan={3} className="border border-slate-200 px-2 py-1 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onDeleteShift(blockIdx)}
                            disabled={disabled}
                            className="text-red-500 hover:text-red-700 text-lg font-bold
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Hapus shift"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Separator antar shift-block */}
                  <tr key={`${blockIdx}-sep`}>
                    <td colSpan={TOTAL_COLS} className="bg-slate-100 h-1 p-0 border-0" />
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAddShift}
        disabled={disabled}
        className="mt-3 flex items-center gap-1 text-sm text-slate-600 font-medium
                   hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-lg leading-none">+</span>
        Tambah Shift
      </button>
    </div>
  );
};

export default TabelImal;
