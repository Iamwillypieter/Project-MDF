const pool = require('../config/db');

// Helper: destructure semua field dari request body
const extractFields = (body) => {
  const {
    kiri_raw_thickness, kiri_fin_thickness,
    kiri_good_board, kiri_m3_goodboard,
    kiri_total_reject, kiri_m3_reject,
    kiri_total_board, kiri_total_board_m3,
    kiri_gluemix, kiri_paraffin, kiri_fibre, kiri_wood, kiri_jenis,
    kanan_raw_thickness, kanan_fin_thickness,
    kanan_good_board, kanan_m3_goodboard,
    kanan_total_reject, kanan_m3_reject,
    kanan_total_board, kanan_total_board_m3,
    kanan_gluemix, kanan_paraffin, kanan_fibre, kanan_wood, kanan_jenis,
    hambatan,
  } = body;
  return [
    kiri_raw_thickness  ?? null, kiri_fin_thickness  ?? null,
    kiri_good_board     ?? null, kiri_m3_goodboard   ?? null,
    kiri_total_reject   ?? null, kiri_m3_reject      ?? null,
    kiri_total_board    ?? null, kiri_total_board_m3 ?? null,
    kiri_gluemix        ?? null, kiri_paraffin       ?? null,
    kiri_fibre          ?? null, kiri_wood           ?? null,
    kiri_jenis          ?? null,
    kanan_raw_thickness  ?? null, kanan_fin_thickness  ?? null,
    kanan_good_board     ?? null, kanan_m3_goodboard   ?? null,
    kanan_total_reject   ?? null, kanan_m3_reject      ?? null,
    kanan_total_board    ?? null, kanan_total_board_m3 ?? null,
    kanan_gluemix        ?? null, kanan_paraffin       ?? null,
    kanan_fibre          ?? null, kanan_wood           ?? null,
    kanan_jenis          ?? null,
    hambatan,
  ];
};

// POST /api/laporan-mdf
const createLaporan = async (req, res) => {
  if (!Array.isArray(req.body.hambatan)) {
    return res.status(400).json({ message: 'Field hambatan harus berupa array' });
  }
  const fields = extractFields(req.body);
  try {
    const result = await pool.query(
      `INSERT INTO laporan_produksi_mdf (
        created_by,
        kiri_raw_thickness, kiri_fin_thickness,
        kiri_good_board, kiri_m3_goodboard,
        kiri_total_reject, kiri_m3_reject,
        kiri_total_board, kiri_total_board_m3,
        kiri_gluemix, kiri_paraffin, kiri_fibre, kiri_wood, kiri_jenis,
        kanan_raw_thickness, kanan_fin_thickness,
        kanan_good_board, kanan_m3_goodboard,
        kanan_total_reject, kanan_m3_reject,
        kanan_total_board, kanan_total_board_m3,
        kanan_gluemix, kanan_paraffin, kanan_fibre, kanan_wood, kanan_jenis,
        hambatan
      ) VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9,  $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28
      ) RETURNING id, created_at`,
      [req.user.id, ...fields.slice(0, 26), JSON.stringify(fields[26])]
    );
    res.status(201).json({
      message: 'Laporan berhasil disimpan',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createLaporan error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-mdf
const getAllLaporan = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_produksi_mdf l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllLaporan error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/laporan-mdf/:id
const getLaporanById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS operator_name
       FROM laporan_produksi_mdf l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.json({ laporan: result.rows[0] });
  } catch (err) {
    console.error('getLaporanById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/laporan-mdf/:id
const updateLaporan = async (req, res) => {
  const { id } = req.params;
  if (!Array.isArray(req.body.hambatan)) {
    return res.status(400).json({ message: 'Field hambatan harus berupa array' });
  }
  const fields = extractFields(req.body);
  try {
    const check = await pool.query('SELECT id FROM laporan_produksi_mdf WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_produksi_mdf SET
        kiri_raw_thickness=$1,  kiri_fin_thickness=$2,
        kiri_good_board=$3,     kiri_m3_goodboard=$4,
        kiri_total_reject=$5,   kiri_m3_reject=$6,
        kiri_total_board=$7,    kiri_total_board_m3=$8,
        kiri_gluemix=$9,        kiri_paraffin=$10,
        kiri_fibre=$11,         kiri_wood=$12,         kiri_jenis=$13,
        kanan_raw_thickness=$14, kanan_fin_thickness=$15,
        kanan_good_board=$16,    kanan_m3_goodboard=$17,
        kanan_total_reject=$18,  kanan_m3_reject=$19,
        kanan_total_board=$20,   kanan_total_board_m3=$21,
        kanan_gluemix=$22,       kanan_paraffin=$23,
        kanan_fibre=$24,         kanan_wood=$25,        kanan_jenis=$26,
        hambatan=$27
       WHERE id=$28
       RETURNING id`,
      [...fields.slice(0, 26), JSON.stringify(fields[26]), id]
    );
    res.json({ message: 'Laporan berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateLaporan error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/laporan-mdf/:id
const deleteLaporan = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM laporan_produksi_mdf WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_produksi_mdf WHERE id = $1', [id]);
    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (err) {
    console.error('deleteLaporan error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = { createLaporan, getAllLaporan, getLaporanById, updateLaporan, deleteLaporan };
