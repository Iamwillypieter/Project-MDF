/**
 * formatWIB — format timestamp ke waktu lokal komputer.
 *
 * Menggunakan jam lokal browser (tidak paksa timezone Asia/Jakarta)
 * agar sesuai dengan jam yang tertera di komputer operator.
 *
 * Output: "09/06/2026 08:47 WIB"
 */
export const formatWIB = (isoString) => {
  if (!isoString) return '-';

  const d = new Date(isoString);

  const tanggal = d.toLocaleDateString('id-ID', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });

  const jam = d.toLocaleTimeString('id-ID', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${tanggal} ${jam} WIB`;
};
