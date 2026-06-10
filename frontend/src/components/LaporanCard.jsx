import { Link } from 'react-router-dom';

/**
 * LaporanCard — reusable card navigasi laporan.
 * Menggantikan LaporanMdfCard, LaporanChipperCard, LaporanCoolingCard, LaporanImalCard.
 *
 * Props:
 *   to      {string}  — route tujuan
 *   icon    {string}  — emoji / karakter ikon
 *   title   {string}  — judul card
 *   desc    {string}  — deskripsi singkat
 *   color   {string}  — kelas Tailwind background (misal 'bg-orange-600')
 */
const LaporanCard = ({ to, icon, title, desc, color }) => {
  return (
    <Link
      to={to}
      className={`
        flex flex-col items-start gap-4 p-5 rounded-xl
        ${color} text-white no-underline
        shadow-md hover:shadow-lg
        hover:-translate-y-1
        transition-all duration-300
        h-full
      `}
    >
      {/* Icon dalam lingkaran semi-transparan */}
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>

      {/* Teks */}
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold leading-snug">{title}</span>
        <span className="text-sm opacity-80 leading-relaxed">{desc}</span>
      </div>

      {/* Arrow indicator */}
      <div className="mt-auto self-end text-white/60 text-sm font-medium">
        Buka →
      </div>
    </Link>
  );
};

export default LaporanCard;
