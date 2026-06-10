import Spinner from './Spinner';

const LoadingState = ({
  message = 'Memuat data...',
  fullPage = false,
  navbar = null,
  className = '',
}) => {
  const inner = (
    <div className={`flex items-center justify-center gap-2 text-slate-400 text-sm ${className}`}>
      <Spinner />
      {message}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-slate-100">
        {navbar}
        <div className={navbar ? 'pt-32' : 'flex items-center justify-center min-h-screen'}>
          {inner}
        </div>
      </div>
    );
  }

  return <div className="py-16">{inner}</div>;
};

export default LoadingState;
