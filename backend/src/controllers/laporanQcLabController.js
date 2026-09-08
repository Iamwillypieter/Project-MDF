const { pool } = require('../config/db');

// POST /api/laporan-qclab
const createLaporanQcLab = async (req, res) => {
  const { tanggal, no_sampel, produk, tebal, shift, hasil_uji, keterangan_umum } = req.body;

  if (!tanggal || !no_sampel || !produk) {
    return res.status(400).json({ message: 'tanggal, no_sampel, dan produk wajib diisi' });
  }
  if (!Array.isArray(hasil_uji)) {
    return res.status(400).json({ message: 'Field hasil_uji harus berupa array' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO laporan_qclab (created_by, tanggal, no_sampel, produk, tebal, shift, hasil_uji, keterangan_umum)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        req.user.id, tanggal, no_sampel, produk,
        tebal || null, shift || null,
        JSON.stringify(hasil_uji),
        keterangan_umum || '',
      ]
    );
    res.status(201).json({
      message: 'Laporan QC Lab berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporanQcLab error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-qclab
const getAllLaporanQcLab = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.created_at, l.tanggal, l.no_sampel, l.produk,
              l.tebal, l.shift, l.hasil_uji, l.keterangan_umum,
              u.name AS operator_name
       FROM laporan_qclab l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporanQcLab error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-qclab/:id
const getLaporanQcLabById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_qclab l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanQcLabById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-qclab/:id
const updateLaporanQcLab = async (req, res) => {
  const { id } = req.params;
  const { tanggal, no_sampel, produk, tebal, shift, hasil_uji, keterangan_umum } = req.body;

  if (!tanggal || !no_sampel || !produk) {
    return res.status(400).json({ message: 'tanggal, no_sampel, dan produk wajib diisi' });
  }
  if (!Array.isArray(hasil_uji)) {
    return res.status(400).json({ message: 'Field hasil_uji harus berupa array' });
  }

  try {
    const check = await pool.query('SELECT id FROM laporan_qclab WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_qclab
       SET tanggal=$1, no_sampel=$2, produk=$3, tebal=$4, shift=$5,
           hasil_uji=$6, keterangan_umum=$7
       WHERE id=$8 RETURNING id`,
      [
        tanggal, no_sampel, produk,
        tebal || null, shift || null,
        JSON.stringify(hasil_uji),
        keterangan_umum || '',
        id,
      ]
    );
    res.json({ message: 'Laporan QC Lab berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporanQcLab error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-qclab/:id
const deleteLaporanQcLab = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_qclab WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_qclab WHERE id = $1', [id]);
    res.json({ message: 'Laporan QC Lab berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporanQcLab error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createLaporanQcLab,
  getAllLaporanQcLab,
  getLaporanQcLabById,
  updateLaporanQcLab,
  deleteLaporanQcLab,
};
