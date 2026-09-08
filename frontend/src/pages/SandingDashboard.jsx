import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

/**
 * SandingDashboard — Menu Utama Role Sanding
 * Grid Card Navigation untuk navigasi ke berbagai laporan sanding
 */
const SandingDashboard = () => {
  const { user } = useAuth();

  const SANDING_CARDS = [
    {
      id: 1,
      to: '/sending/laporan-hasil-sanding',
      icon: '📊',
      title: 'Laporan Hasil Sanding / Grading MDF',
      description: 'Pencatatan jumlah pcs, tebal papan, kalkulasi M³ (Grade A, B, CR, SU), serta pencatatan jam hambatan.',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      badge: null,
    },
    {
      id: 2,
      to: '/sending/laporan-kertas-pasir',
      icon: '📋',
      title: 'Laporan Pemakaian Kertas Pasir',
      description: 'Monitoring penggunaan grit/grade kertas pasir (Grade 60, 80, 100, 120, 150) pada posisi Atas (A) & Bawah (B) beserta jumlah papan.',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      badge: null,
    },
  ];

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        
        {/* Header */}
        <div className="dashboard-header">
          <h2>Dashboard Sanding</h2>
          <p>Selamat datang, <strong>{user?.name}</strong>. Pilih laporan yang ingin dikelola.</p>
        </div>

        {/* Grid Card Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SANDING_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.to}
              className={`relative group ${card.color} rounded-xl shadow-lg overflow-hidden 
                         hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer`}
              style={{ textDecoration: 'none' }}
            >
              {/* Badge (jika ada) */}
              {card.badge && (
                <div className="absolute top-4 right-4 bg-white/90 text-xs font-semibold px-2.5 py-1 rounded-full text-slate-700 shadow-sm">
                  {card.badge}
                </div>
              )}

              {/* Content */}
              <div className="p-6 text-white">
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-5xl">{card.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 leading-tight">
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/90 leading-relaxed">
                  {card.description}
                </p>

                {/* Arrow indicator */}
                <div className="flex items-center justify-end mt-4 text-white/80 group-hover:text-white transition-colors">
                  <span className="text-xs font-semibold mr-1">Buka Form</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Panduan Penggunaan</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Pilih kartu laporan yang ingin Anda isi atau kelola</li>
                <li>• Setiap laporan memiliki fungsi auto-save sebagai draft</li>
                <li>• Data dapat diedit kembali setelah disimpan</li>
              </ul>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SandingDashboard;
