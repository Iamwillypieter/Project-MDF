const pool = require('../config/db');

// POST /api/laporan-chipper — simpan 1 dokumen sebagai single row
const createLaporanChipper = async (req, res) => {
  const { data_log, hambatan } = req.body;

  if (!Array.isArray(data_log)) {
    return res.status(400).json({ message: 'Field data_log harus berupa array' });
  }
  if (!Array.isArray(hambatan)) {
    return res.status(400).json({ message: 'Field hambatan harus berupa array' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO laporan_chipper_mdf (created_by, data_log, hambatan)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.user.id, JSON.stringify(data_log), JSON.stringify(hambatan)]
    );

    res.status(201).json({
      message: 'Laporan Chipper berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporanChipper error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-chipper — semua laporan
const getAllLaporanChipper = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.created_at, l.data_log, l.hambatan, u.name AS operator_name
       FROM laporan_chipper_mdf l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporanChipper error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-chipper/:id — 1 laporan by id
const getLaporanChipperById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_chipper_mdf l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanChipperById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-chipper/:id — update (hanya produksi)
const updateLaporanChipper = async (req, res) => {
  const { id } = req.params;
  const { data_log, hambatan } = req.body;

  if (!Array.isArray(data_log)) {
    return res.status(400).json({ message: 'Field data_log harus berupa array' });
  }
  if (!Array.isArray(hambatan)) {
    return res.status(400).json({ message: 'Field hambatan harus berupa array' });
  }

  try {
    const check = await pool.query('SELECT id FROM laporan_chipper_mdf WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE laporan_chipper_mdf SET data_log=$1, hambatan=$2
       WHERE id=$3 RETURNING id`,
      [JSON.stringify(data_log), JSON.stringify(hambatan), id]
    );

    res.json({ message: 'Laporan Chipper berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporanChipper error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-chipper/:id — hapus laporan (hanya admin)
const deleteLaporanChipper = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_chipper_mdf WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_chipper_mdf WHERE id = $1', [id]);
    res.json({ message: 'Laporan Chipper berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporanChipper error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createLaporanChipper,
  getAllLaporanChipper,
  getLaporanChipperById,
  updateLaporanChipper,
  deleteLaporanChipper,
};
