const pool = require('../config/db');

// POST /api/laporan-cooling
const createLaporanCooling = async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ message: 'Field rows harus berupa array' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO laporan_cooling_staking (created_by, rows)
       VALUES ($1, $2) RETURNING id, created_at`,
      [req.user.id, JSON.stringify(rows)]
    );
    res.status(201).json({
      message: 'Laporan Cooling Staking berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporanCooling error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-cooling
const getAllLaporanCooling = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.created_at, l.rows, u.name AS operator_name
       FROM laporan_cooling_staking l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporanCooling error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-cooling/:id
const getLaporanCoolingById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_cooling_staking l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanCoolingById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-cooling/:id
const updateLaporanCooling = async (req, res) => {
  const { id } = req.params;
  const { rows } = req.body;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ message: 'Field rows harus berupa array' });
  }
  try {
    const check = await pool.query('SELECT id FROM laporan_cooling_staking WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_cooling_staking SET rows=$1 WHERE id=$2 RETURNING id`,
      [JSON.stringify(rows), id]
    );
    res.json({ message: 'Laporan Cooling Staking berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporanCooling error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-cooling/:id
const deleteLaporanCooling = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_cooling_staking WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_cooling_staking WHERE id = $1', [id]);
    res.json({ message: 'Laporan Cooling Staking berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporanCooling error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createLaporanCooling,
  getAllLaporanCooling,
  getLaporanCoolingById,
  updateLaporanCooling,
  deleteLaporanCooling,
};
