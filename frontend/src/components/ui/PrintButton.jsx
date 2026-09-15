/**
 * PrintButton — tombol cetak seragam untuk semua history laporan
 *
 * Props:
 *   onClick   : fungsi yang dipanggil saat klik
 *   loading   : boolean — tampilkan spinner
 *   label     : teks tombol (default: "Cetak")
 *   size      : 'sm' | 'md' (default: 'sm')
 *   variant   : 'outline' | 'solid' (default: 'outline')
 */
const PrintButton = ({
  onClick,
  loading = false,
  label = 'Cetak',
  size = 'sm',
  variant = 'outline',
  disabled = false,
}) => {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors no-print';
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  const variants = {
    outline: 'border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-400',
    solid:   'text-white bg-teal-600 hover:bg-teal-700 border border-teal-600',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <>
          {/* Mini spinner */}
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Memuat...
        </>
      ) : (
        <>
          {/* Printer icon */}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
};

export default PrintButton;
