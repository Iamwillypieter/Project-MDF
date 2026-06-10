import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LaporanTable from '../components/laporan-mdf/LaporanTable';

// 4 opsi form — mudah ditambah tanpa ubah struktur JSX
const FORM_OPTIONS = [
  { to: '/produksi/laporan-mdf',     icon: '📋', label: 'Laporan MDF',             desc: 'Produksi MDF'           },
  { to: '/produksi/laporan-chipper', icon: '🪚', label: 'Laporan Chipper MDF',      desc: 'Chipper MDF'            },
  { to: '/produksi/laporan-cooling', icon: '❄️', label: 'Laporan Cooling Staking',  desc: 'Cooling & Staking'      },
  { to: '/produksi/laporan-imal',    icon: '🧪', label: 'Laporan IMAL',             desc: 'Pemakaian Bahan Baku'   },
];

/**
 * TambahLaporanButton
 * Komponen terisolasi — state `isOpen` hidup di sini, tidak memicu
 * re-render halaman parent (HistoryLaporan) saat dropdown dibuka/tutup.
 */
const TambahLaporanButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Tutup dropdown saat klik di luar container
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    // position: relative jadi anchor dropdown, tidak menggeser layout di bawahnya
    <div ref={containerRef} className="relative">

      {/* ── Tombol utama ── */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                   text-white bg-blue-600 hover:bg-blue-700 transition-colors
                   shadow-sm select-none"
      >
        <span className="text-base leading-none">+</span>
        Tambah Laporan Baru
        {/* Chevron — rotasi saat terbuka */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" clipRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          />
        </svg>
      </button>

      {/* ── Dropdown menu — position absolute agar tidak mendorong konten bawah ── */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl
                     border border-slate-100 z-50 overflow-hidden
                     animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Pilih Jenis Laporan
            </p>
          </div>

          {FORM_OPTIONS.map(({ to, icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)} // reset state saat opsi dipilih
              className="flex items-center gap-3 px-4 py-3
                         hover:bg-slate-50 transition-colors group no-underline"
            >
              {/* Icon container */}
              <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50
                              flex items-center justify-center text-lg flex-shrink-0
                              transition-colors">
                {icon}
              </div>

              {/* Label & desc */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-800 leading-snug">
                  {label}
                </span>
                <span className="text-xs text-slate-400 truncate">{desc}</span>
              </div>

              {/* Arrow */}
              <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 ml-auto
                              flex-shrink-0 transition-colors"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * HistoryLaporan — /produksi/history-laporan
 */
const HistoryLaporan = () => {
  const { token, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">History Laporan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Semua laporan Produksi MDF &amp; Chipper MDF digabungkan, diurutkan terbaru.
            </p>
          </div>

          {/* Tombol tambah — hanya role produksi, terisolasi sebagai komponen sendiri */}
          {user?.role === 'produksi' && <TambahLaporanButton />}
        </div>

        {/* Tabel gabungan — tidak terpengaruh dropdown karena dropdown position absolute */}
        <LaporanTable token={token} userRole={user?.role} />

      </main>
    </div>
  );
};

export default HistoryLaporan;
