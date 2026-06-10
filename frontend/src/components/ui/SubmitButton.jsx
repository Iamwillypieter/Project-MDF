import Spinner from './Spinner';

const SubmitButton = ({
  isSubmitting,
  label = 'Simpan Laporan',
  loadingLabel = 'Menyimpan...',
  className = 'px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2',
  spinnerClassName = 'text-white',
  ...props
}) => (
  <button type="submit" disabled={isSubmitting} className={className} {...props}>
    {isSubmitting ? (
      <>
        <Spinner size="sm" className={spinnerClassName} />
        {loadingLabel}
      </>
    ) : (
      label
    )}
  </button>
);

export default SubmitButton;
