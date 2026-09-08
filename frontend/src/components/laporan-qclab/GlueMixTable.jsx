/**
 * GlueMixTable
 * Tabel 3: Glue Mix Analysis
 *
 * Props:
 *   data          {Object}   — glue_mix object
 *   disabled      {boolean}
 *   onFieldChange {fn}       — (key, val) => void  — untuk top-level fields
 *   onSampleChange {fn}      — (rowIdx, key, val) => void — untuk sample rows
 */

const numInput = (value, onChange, disabled, placeholder = '') => (
  <input
    type="number"
    step="0.001"
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder || '0.000'}
    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-right
               focus:ring-1 focus:ring-teal-500 focus:border-teal-500
               disabled:bg-slate-50 disabled:text-slate-400"
  />
);

const GlueMixTable = ({ data, disabled, onFieldChange, onSampleChange }) => {
  const samples = Array.isArray(data?.samples) ? data.samples : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
      {/* Section header */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
          D
        </span>
        Glue Mix Analysis
      </h2>

      {/* Formula note */}
      <div className="mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        📐 Rumus Solid Content (%) = <span className="font-mono">((c − a) / b) × 100</span>
        &nbsp;—&nbsp; a = Foil Weight, b = Gluemix Weight, c = A1.Foil + Dry Glue
      </div>

      {/* Time In / Out */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time (In)</label>
          <input
            type="time"
            value={data?.time_in ?? ''}
            onChange={e => onFieldChange('time_in', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                       disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time (Out)</label>
          <input
            type="time"
            value={data?.time_out ?? ''}
            onChange={e => onFieldChange('time_out', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                       disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
      </div>

      {/* Layout: Sample Matrix (kiri) + Glue Metrics (kanan) */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Sample Matrix Table ── */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Sample Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[550px]">
              <thead>
                <tr className="bg-teal-50 border-b-2 border-teal-200">
                  <th className="text-center py-2.5 px-2 font-semibold text-teal-800 w-16">Sample</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                    A1. Foil Weight (gr) [a]
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                    Gluemix Weight (gr) [b]
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                    A1. Foil + Dry Glue (gr) [c]
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                    Solid Content (%)
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-teal-800">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    {/* Row label */}
                    <td className="py-2 px-2 text-center">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {s.row_label}
                      </span>
                    </td>

                    {/* Foil Weight [a] */}
                    <td className="py-2 px-2">
                      {numInput(
                        s.foil_weight,
                        val => onSampleChange(idx, 'foil_weight', val),
                        disabled
                      )}
                    </td>

                    {/* Gluemix Weight [b] */}
                    <td className="py-2 px-2">
                      {numInput(
                        s.gluemix_weight,
                        val => onSampleChange(idx, 'gluemix_weight', val),
                        disabled
                      )}
                    </td>

                    {/* Foil + Dry Glue [c] */}
                    <td className="py-2 px-2">
                      {numInput(
                        s.foil_dry_glue,
                        val => onSampleChange(idx, 'foil_dry_glue', val),
                        disabled
                      )}
                    </td>

                    {/* Solid Content — auto-calculated */}
                    <td className="py-2 px-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={s.solid_content ?? ''}
                          onChange={e => onSampleChange(idx, 'solid_content', e.target.value)}
                          disabled={disabled}
                          placeholder="Auto"
                          className="w-full px-2 py-1.5 border border-teal-300 rounded text-sm text-right font-semibold
                                     bg-teal-50 text-teal-800 focus:ring-1 focus:ring-teal-500
                                     disabled:opacity-70"
                        />
                        {s.solid_content && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-teal-600 font-medium pointer-events-none">
                            %
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Remark */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={s.remark ?? ''}
                        onChange={e => onSampleChange(idx, 'remark', e.target.value)}
                        disabled={disabled}
                        placeholder="Opsional..."
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm
                                   focus:ring-1 focus:ring-teal-500 focus:border-teal-500
                                   disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                ))}

                {/* Average row */}
                <tr className="bg-teal-50 border-t-2 border-teal-200 font-semibold">
                  <td colSpan={4} className="py-2.5 px-2 text-right text-teal-800 text-sm pr-4">
                    Average Solid Content:
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="relative">
                      <span className="block w-full px-2 py-1.5 border border-teal-400 rounded text-sm text-right font-bold bg-teal-100 text-teal-900">
                        {data?.solid_content_avg
                          ? `${data.solid_content_avg}%`
                          : <span className="text-teal-400 font-normal">—</span>
                        }
                      </span>
                    </div>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Glue Metrics (Kanan) ── */}
        <div className="lg:w-64 shrink-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Glue Metrics
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col gap-3">

            {/* Viscosity */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                Viscosity (cps)
              </label>
              {numInput(
                data?.viscosity,
                val => onFieldChange('viscosity', val),
                disabled,
                '0'
              )}
            </div>

            {/* Temp */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                Temp (°C)
              </label>
              {numInput(
                data?.temp,
                val => onFieldChange('temp', val),
                disabled,
                '0.0'
              )}
            </div>

            {/* Density */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                Density (kg/m³)
              </label>
              {numInput(
                data?.density,
                val => onFieldChange('density', val),
                disabled,
                '0.000'
              )}
            </div>

            {/* pH */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                pH
              </label>
              {numInput(
                data?.ph,
                val => onFieldChange('ph', val),
                disabled,
                '7.0'
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default GlueMixTable;
