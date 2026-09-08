/**
 * numericAggregation.js
 * ---------------------
 * Reusable helpers untuk agregasi numerik yang aman dari:
 *   - Pembagian dengan nol
 *   - NaN / Infinity dari parseFloat
 *   - Array kosong atau semua nilai non-numerik
 *
 * Semua fungsi menerima:
 *   arr  — array of objects
 *   key  — nama property yang akan diagregasi
 *   dec  — jumlah desimal (default 2)
 *
 * Kembalian: string angka (e.g. "3.14") atau '' jika tidak ada nilai valid.
 */

/**
 * Ambil semua nilai numerik yang valid dari array of objects.
 * Menyaring NaN, Infinity, dan nilai non-finite lainnya.
 *
 * @param {Object[]} arr
 * @param {string}   key
 * @returns {number[]}
 */
export const numericValues = (arr, key) =>
  arr
    .map(r => parseFloat(r[key]))
    .filter(v => Number.isFinite(v));

/**
 * Rata-rata (average) — aman dari zero-division.
 *
 * @param {Object[]} arr
 * @param {string}   key
 * @param {number}   [dec=2]
 * @returns {string}
 */
export const safeAvg = (arr, key, dec = 2) => {
  const vals = numericValues(arr, key);
  if (vals.length === 0) return '';
  return (vals.reduce((sum, v) => sum + v, 0) / vals.length).toFixed(dec);
};

/**
 * Nilai tertinggi (maximum).
 *
 * @param {Object[]} arr
 * @param {string}   key
 * @param {number}   [dec=2]
 * @returns {string}
 */
export const safeMax = (arr, key, dec = 2) => {
  const vals = numericValues(arr, key);
  if (vals.length === 0) return '';
  return Math.max(...vals).toFixed(dec);
};

/**
 * Nilai terendah (minimum).
 *
 * @param {Object[]} arr
 * @param {string}   key
 * @param {number}   [dec=2]
 * @returns {string}
 */
export const safeMin = (arr, key, dec = 2) => {
  const vals = numericValues(arr, key);
  if (vals.length === 0) return '';
  return Math.min(...vals).toFixed(dec);
};

/**
 * Agregasi lengkap (avg, max, min) untuk satu key.
 *
 * @param {Object[]} arr
 * @param {string}   key
 * @param {number}   [dec=2]
 * @returns {{ avg: string, max: string, min: string }}
 */
export const aggregateKey = (arr, key, dec = 2) => ({
  avg: safeAvg(arr, key, dec),
  max: safeMax(arr, key, dec),
  min: safeMin(arr, key, dec),
});

/**
 * Agregasi lengkap untuk beberapa key sekaligus.
 * Mengembalikan objek: { avg: {k1: '', k2: ''}, max: {...}, min: {...} }
 *
 * @param {Object[]} arr
 * @param {string[]} keys
 * @param {number}   [dec=2]
 * @returns {{ avg: Object, max: Object, min: Object }}
 */
export const aggregateKeys = (arr, keys, dec = 2) => {
  const result = { avg: {}, max: {}, min: {} };
  for (const k of keys) {
    result.avg[k] = safeAvg(arr, k, dec);
    result.max[k] = safeMax(arr, k, dec);
    result.min[k] = safeMin(arr, k, dec);
  }
  return result;
};
