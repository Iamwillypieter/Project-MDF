const { pool } = require('../config/db');

// POST /api/laporan-sanding
const createLaporanSanding = async (req, res) => {
  const { ukuran_tebal, tanggal_produksi, group, grading, keterangan, hambatan } = req.body;

  if (!ukuran_tebal || !tanggal_produksi || !group) {
    return res.status(400).json({ message: 'ukuran_tebal, tanggal_produksi, dan group wajib diisi' });
  }
  if (typeof grading !== 'object' || grading === null) {
    return res.status(400).json({ message: 'Field grading harus berupa object' });
  }
  if (!Array.isArray(hambatan)) {
    return res.status(400).json({ message: 'Field hambatan harus berupa array' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO laporan_sanding (created_by, ukuran_tebal, tanggal_produksi, "group", grading, keterangan, hambatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        req.user.id,
        ukuran_tebal,
        tanggal_produksi,
        group,
        JSON.stringify(grading),
        keterangan || '',
        JSON.stringify(hambatan),
      ]
    );
    res.status(201).json({
      message: 'Laporan Sanding berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporanSanding error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-sanding
const getAllLaporanSanding = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.created_at, l.ukuran_tebal, l.tanggal_produksi,
              l."group", l.grading, l.keterangan, l.hambatan,
              u.name AS operator_name
       FROM laporan_sanding l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporanSanding error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-sanding/:id
const getLaporanSandingById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_sanding l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanSandingById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-sanding/:id
const updateLaporanSanding = async (req, res) => {
  const { id } = req.params;
  const { ukuran_tebal, tanggal_produksi, group, grading, keterangan, hambatan } = req.body;

  if (!ukuran_tebal || !tanggal_produksi || !group) {
    return res.status(400).json({ message: 'ukuran_tebal, tanggal_produksi, dan group wajib diisi' });
  }
  if (typeof grading !== 'object' || grading === null) {
    return res.status(400).json({ message: 'Field grading harus berupa object' });
  }
  if (!Array.isArray(hambatan)) {
    return res.status(400).json({ message: 'Field hambatan harus berupa array' });
  }

  try {
    const check = await pool.query('SELECT id FROM laporan_sanding WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_sanding
       SET ukuran_tebal=$1, tanggal_produksi=$2, "group"=$3,
           grading=$4, keterangan=$5, hambatan=$6
       WHERE id=$7
       RETURNING id`,
      [
        ukuran_tebal,
        tanggal_produksi,
        group,
        JSON.stringify(grading),
        keterangan || '',
        JSON.stringify(hambatan),
        id,
      ]
    );
    res.json({ message: 'Laporan Sanding berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporanSanding error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-sanding/:id
const deleteLaporanSanding = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_sanding WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_sanding WHERE id = $1', [id]);
    res.json({ message: 'Laporan Sanding berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporanSanding error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createLaporanSanding,
  getAllLaporanSanding,
  getLaporanSandingById,
  updateLaporanSanding,
  deleteLaporanSanding,
};
