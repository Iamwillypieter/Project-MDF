const { pool } = require('../config/db');

// POST /api/laporan-kertas-pasir
const createLaporanKertasPasir = async (req, res) => {
  const { tanggal, transaksi, keterangan } = req.body;

  if (!tanggal) {
    return res.status(400).json({ message: 'Field tanggal wajib diisi' });
  }
  if (!Array.isArray(transaksi)) {
    return res.status(400).json({ message: 'Field transaksi harus berupa array' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO laporan_kertas_pasir (created_by, tanggal, transaksi, keterangan)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [req.user.id, tanggal, JSON.stringify(transaksi), keterangan || '']
    );
    res.status(201).json({
      message: 'Laporan Kertas Pasir berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporanKertasPasir error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-kertas-pasir
const getAllLaporanKertasPasir = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.created_at, l.tanggal, l.transaksi, l.keterangan,
              u.name AS operator_name
       FROM laporan_kertas_pasir l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporanKertasPasir error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-kertas-pasir/:id
const getLaporanKertasPasirById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_kertas_pasir l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanKertasPasirById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-kertas-pasir/:id
const updateLaporanKertasPasir = async (req, res) => {
  const { id } = req.params;
  const { tanggal, transaksi, keterangan } = req.body;

  if (!tanggal) {
    return res.status(400).json({ message: 'Field tanggal wajib diisi' });
  }
  if (!Array.isArray(transaksi)) {
    return res.status(400).json({ message: 'Field transaksi harus berupa array' });
  }

  try {
    const check = await pool.query('SELECT id FROM laporan_kertas_pasir WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_kertas_pasir SET tanggal=$1, transaksi=$2, keterangan=$3
       WHERE id=$4 RETURNING id`,
      [tanggal, JSON.stringify(transaksi), keterangan || '', id]
    );
    res.json({ message: 'Laporan Kertas Pasir berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporanKertasPasir error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-kertas-pasir/:id
const deleteLaporanKertasPasir = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_kertas_pasir WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_kertas_pasir WHERE id = $1', [id]);
    res.json({ message: 'Laporan Kertas Pasir berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporanKertasPasir error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createLaporanKertasPasir,
  getAllLaporanKertasPasir,
  getLaporanKertasPasirById,
  updateLaporanKertasPasir,
  deleteLaporanKertasPasir,
};
