const { pool } = require('../config/db');

// POST /api/laporan-imal
const createLaporanImal = async (req, res) => {
  const { shifts } = req.body;
  if (!Array.isArray(shifts)) {
    return res.status(400).json({ message: 'Field shifts harus berupa array' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO laporan_imal (created_by, shifts)
       VALUES ($1, $2) RETURNING id, created_at`,
      [req.user.id, JSON.stringify(shifts)]
    );
    res.status(201).json({
      message: 'Laporan IMAL berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporanImal error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-imal
const getAllLaporanImal = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.created_at, l.shifts, u.name AS operator_name
       FROM laporan_imal l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporanImal error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-imal/:id
const getLaporanImalById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_imal l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanImalById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-imal/:id — update data shifts (produksi)
const updateLaporanImal = async (req, res) => {
  const { id } = req.params;
  const { shifts } = req.body;
  if (!Array.isArray(shifts)) {
    return res.status(400).json({ message: 'Field shifts harus berupa array' });
  }
  try {
    const check = await pool.query('SELECT id FROM laporan_imal WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_imal SET shifts=$1 WHERE id=$2 RETURNING id`,
      [JSON.stringify(shifts), id]
    );
    res.json({ message: 'Laporan IMAL berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporanImal error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PATCH /api/laporan-imal/:id/verifikasi — verifikasi oleh admin (sign-off)
const verifikasiLaporanImal = async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil data shifts saat ini
    const current = await pool.query('SELECT shifts FROM laporan_imal WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    // Update semua shift-block: set diperiksa_status = 'verified'
    const shifts = current.rows[0].shifts;
    const updatedShifts = shifts.map(s => ({
      ...s,
      diperiksa_status: 'verified',
      diperiksa_oleh: req.user.name,
      diperiksa_at: new Date().toISOString(),
    }));

    await pool.query(
      'UPDATE laporan_imal SET shifts=$1 WHERE id=$2',
      [JSON.stringify(updatedShifts), id]
    );

    res.json({
      message: 'Laporan IMAL berhasil diverifikasi',
      diperiksa_oleh: req.user.name,
      diperiksa_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('verifikasiLaporanImal error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-imal/:id — hapus (admin)
const deleteLaporanImal = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_imal WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_imal WHERE id = $1', [id]);
    res.json({ message: 'Laporan IMAL berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporanImal error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createLaporanImal, getAllLaporanImal, getLaporanImalById,
  updateLaporanImal, verifikasiLaporanImal, deleteLaporanImal,
};
