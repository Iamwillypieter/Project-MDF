/**
 * ParameterGrid
 * Controlled component — semua value & onChange datang dari parent.
 *
 * Derived state (State-Driven Calculation):
 * Nilai kalkulasi TIDAK disimpan di state — dihitung langsung saat render
 * dari nilai input yang ada. Ini mencegah state tidak sinkron.
 *
 *   M3 Goodboard  = (good_board  * fin_thickness * 2.44 * 3.66) / 1000
 *   M3 Reject     = (total_reject * fin_thickness * 2.44 * 3.66) / 1000
 *   Total Board (Lbr) = good_board + total_reject  → readOnly
 *   Total Board (M3)  = M3 Goodboard + M3 Reject   → readOnly
 */

// Helper: hitung nilai, kembalikan string kosong jika input tidak valid
const calc = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? '' : n;
};

const fmt = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const n = parseFloat(val);
  return isNaN(n) ? '' : parseFloat(n.toFixed(4)).toString();
};

const ParameterGrid = ({ title, sisi, data, onChange, disabled }) => {
  const handleChange = (key, value) => onChange(sisi, key, value);

  // ── Derived calculations — dihitung saat render, tidak masuk ke state ──
  const finT       = calc(data.fin_thickness);
  const goodBoard  = calc(data.good_board);
  const totalReject = calc(data.total_reject);

  const m3Goodboard = (finT !== '' && goodBoard !== '')
    ? fmt((goodBoard * finT * 2.44 * 3.66) / 1000)
    : '';

  const m3Reject = (finT !== '' && totalReject !== '')
    ? fmt((totalReject * finT * 2.44 * 3.66) / 1000)
    : '';

  const totalBoardLbr = (goodBoard !== '' || totalReject !== '')
    ? fmt((goodBoard || 0) + (totalReject || 0))
    : '';

  const totalBoardM3 = (m3Goodboard !== '' || m3Reject !== '')
    ? fmt((parseFloat(m3Goodboard) || 0) + (parseFloat(m3Reject) || 0))
    : '';

  // Urutan baris yang akan dirender
  const rows = [
    { key: 'raw_thickness', label: 'Raw. Thickness', unit: 'Mm',    readOnly: false, derived: false },
    { key: 'fin_thickness', label: 'Fin. Thickness', unit: 'Mm',    readOnly: false, derived: false },
    { key: 'good_board',    label: 'Good Board',     unit: 'Lbr',   readOnly: false, derived: false },
    { key: 'm3_goodboard',  label: 'M3 Goodboard',   unit: 'M3',    readOnly: true,  derived: true,  value: m3Goodboard },
    { key: 'total_reject',  label: 'Total Reject',   unit: 'Lbr',   readOnly: false, derived: false },
    { key: 'm3_reject',     label: 'M3 Reject',      unit: 'M3',    readOnly: true,  derived: true,  value: m3Reject },
    { key: 'total_board',   label: 'Total Board',    unit: 'Lbr',   readOnly: true,  derived: true,  value: totalBoardLbr },
    { key: 'total_board_m3',label: 'Total Board',    unit: 'M3',    readOnly: true,  derived: true,  value: totalBoardM3 },
    { key: 'gluemix',       label: 'Gluemix',        unit: 'Ltr',   readOnly: false, derived: false },
    { key: 'paraffin',      label: 'Paraffin',       unit: 'Kg/Ltr',readOnly: false, derived: false },
    { key: 'fibre',         label: 'Fibre',          unit: 'Kg/Ltr',readOnly: false, derived: false },
    { key: 'wood',          label: 'Wood',           unit: 'Kg',    readOnly: false, derived: false },
  ];

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="bg-slate-700 text-white text-center text-sm font-semibold py-2 rounded-t-lg">
        {title}
      </div>

      <div className="border border-slate-200 rounded-b-lg overflow-hidden">
        {rows.map((field, idx) => {
          const displayValue = field.derived ? field.value : (data[field.key] ?? '');
          const isReadOnly   = field.readOnly || disabled;

          return (
            <div
              key={field.key}
              className={`flex items-center gap-2 px-3 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
            >
              <span className="w-40 text-xs text-slate-600 shrink-0">
                {field.label}
                <span className="text-slate-400 ml-1">({field.unit})</span>
                {/* Badge readonly untuk kolom kalkulasi */}
                {field.derived && (
                  <span className="ml-1 text-[10px] text-amber-500 font-semibold">auto</span>
                )}
              </span>
              <span className="text-slate-400 text-xs">:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={displayValue}
                onChange={field.derived ? undefined : e => handleChange(field.key, e.target.value)}
                readOnly={field.derived}
                disabled={!field.derived && disabled}
                className={`flex-1 border border-slate-200 rounded px-2 py-1 text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                            ${field.derived
                              ? 'bg-amber-50 text-amber-800 cursor-default border-amber-100'
                              : 'text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed'
                            }`}
              />
            </div>
          );
        })}

        {/* Row Jenis */}
        <div className={`flex items-center gap-2 px-3 py-2 ${rows.length % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
          <span className="w-40 text-xs text-slate-600 shrink-0">
            Jenis
          </span>
          <span className="text-slate-400 text-xs">:</span>
          <select
            value={data.jenis ?? ''}
            onChange={e => handleChange('jenis', e.target.value)}
            disabled={disabled}
            className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                       disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
          >
            <option value="">-- Pilih --</option>
            <option value="Rmbg">Rmbg</option>
            <option value="Std">Std</option>
            <option value="E2">E2</option>
            <option value="P2">P2</option>
            <option value="HMR">HMR</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ParameterGrid;
