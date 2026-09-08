const { pool } = require('../config/db');

// ── Helper ────────────────────────────────────────────────────────────────────
const parseJsonb = (val, fallback) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val; // pg driver sudah parse JSONB
  try { return JSON.parse(val); } catch { return fallback; }
};

// ── POST /api/laporan-qclab-shift ─────────────────────────────────────────────
const createShiftReport = async (req, res) => {
  const {
    tanggal, shift_group, nik_nama_1, nik_nama_2,
    kondisi_lampu, lokasi_kerja,
    chips_moisture, chips_bulk_density, glue_mix,
    hardener_wax, screen_test, thick_density, press_params, section8,
    status,
  } = req.body;

  if (!tanggal) {
    return res.status(400).json({ message: 'Field tanggal wajib diisi.' });
  }

  const allowedStatus = ['draft', 'submitted', 'approved'];
  const finalStatus = allowedStatus.includes(status) ? status : 'draft';

  try {
    const result = await pool.query(
      `INSERT INTO laporan_qclab_shift_report
         (created_by, tanggal, shift_group, nik_nama_1, nik_nama_2,
          kondisi_lampu, lokasi_kerja,
          chips_moisture, chips_bulk_density, glue_mix, status, hardener_wax,
          screen_test, thick_density, press_params, section8)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, created_at, status`,
      [
        req.user.id,
        tanggal,
        shift_group   || null,
        nik_nama_1    || null,
        nik_nama_2    || null,
        kondisi_lampu || 'OK',
        lokasi_kerja  || 'Bersih',
        JSON.stringify(Array.isArray(chips_moisture)     ? chips_moisture     : []),
        JSON.stringify(Array.isArray(chips_bulk_density) ? chips_bulk_density : []),
        JSON.stringify(glue_mix      && typeof glue_mix === 'object'      ? glue_mix      : {}),
        finalStatus,
        JSON.stringify(Array.isArray(hardener_wax)  ? hardener_wax  : []),
        JSON.stringify(screen_test   && typeof screen_test === 'object'   ? screen_test   : {}),
        JSON.stringify(Array.isArray(thick_density) ? thick_density  : []),
        JSON.stringify(Array.isArray(press_params)  ? press_params   : []),
        JSON.stringify(section8      && typeof section8 === 'object'      ? section8      : {}),
      ]
    );
    res.status(201).json({
      message: 'Quality Shift Report berhasil disimpan',
      id:         result.rows[0].id,
      created_at: result.rows[0].created_at,
      status:     result.rows[0].status,
    });
  } catch (err) {
    console.error('createShiftReport error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── GET /api/laporan-qclab-shift ──────────────────────────────────────────────
const getAllShiftReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.created_at, r.tanggal, r.shift_group,
              r.nik_nama_1, r.nik_nama_2, r.kondisi_lampu, r.lokasi_kerja,
              r.status, u.name AS operator_name
       FROM laporan_qclab_shift_report r
       LEFT JOIN users u ON r.created_by = u.id
       ORDER BY r.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllShiftReports error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── GET /api/laporan-qclab-shift/:id ─────────────────────────────────────────
const getShiftReportById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS operator_name
       FROM laporan_qclab_shift_report r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const row = result.rows[0];
    // Normalise JSONB fields
    row.chips_moisture     = parseJsonb(row.chips_moisture,     []);
    row.chips_bulk_density = parseJsonb(row.chips_bulk_density, []);
    row.glue_mix           = parseJsonb(row.glue_mix,           {});
    row.hardener_wax       = parseJsonb(row.hardener_wax,       []);
    row.screen_test        = parseJsonb(row.screen_test,        {});
    row.thick_density      = parseJsonb(row.thick_density,      []);
    row.press_params       = parseJsonb(row.press_params,       []);
    row.section8           = parseJsonb(row.section8,           {});
    res.json({ laporan: row });
  } catch (err) {
    console.error('getShiftReportById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── PUT /api/laporan-qclab-shift/:id ─────────────────────────────────────────
const updateShiftReport = async (req, res) => {
  const { id } = req.params;
  const {
    tanggal, shift_group, nik_nama_1, nik_nama_2,
    kondisi_lampu, lokasi_kerja,
    chips_moisture, chips_bulk_density, glue_mix,
    hardener_wax, screen_test, thick_density, press_params, section8,
    status,
  } = req.body;

  if (!tanggal) {
    return res.status(400).json({ message: 'Field tanggal wajib diisi.' });
  }

  const allowedStatus = ['draft', 'submitted', 'approved'];
  const finalStatus = allowedStatus.includes(status) ? status : 'draft';

  try {
    const check = await pool.query(
      'SELECT id FROM laporan_qclab_shift_report WHERE id = $1', [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE laporan_qclab_shift_report SET
         tanggal=$1, shift_group=$2, nik_nama_1=$3, nik_nama_2=$4,
         kondisi_lampu=$5, lokasi_kerja=$6,
         chips_moisture=$7, chips_bulk_density=$8, glue_mix=$9, status=$10,
         hardener_wax=$11, screen_test=$12, thick_density=$13,
         press_params=$14, section8=$15
       WHERE id=$16 RETURNING id, status`,
      [
        tanggal,
        shift_group   || null,
        nik_nama_1    || null,
        nik_nama_2    || null,
        kondisi_lampu || 'OK',
        lokasi_kerja  || 'Bersih',
        JSON.stringify(Array.isArray(chips_moisture)     ? chips_moisture     : []),
        JSON.stringify(Array.isArray(chips_bulk_density) ? chips_bulk_density : []),
        JSON.stringify(glue_mix      && typeof glue_mix === 'object'      ? glue_mix      : {}),
        finalStatus,
        JSON.stringify(Array.isArray(hardener_wax)  ? hardener_wax  : []),
        JSON.stringify(screen_test   && typeof screen_test === 'object'   ? screen_test   : {}),
        JSON.stringify(Array.isArray(thick_density) ? thick_density  : []),
        JSON.stringify(Array.isArray(press_params)  ? press_params   : []),
        JSON.stringify(section8      && typeof section8 === 'object'      ? section8      : {}),
        id,
      ]
    );
    res.json({
      message: 'Quality Shift Report berhasil diupdate',
      id:     result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (err) {
    console.error('updateShiftReport error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── DELETE /api/laporan-qclab-shift/:id ──────────────────────────────────────
const deleteShiftReport = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query(
      'SELECT id FROM laporan_qclab_shift_report WHERE id = $1', [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_qclab_shift_report WHERE id = $1', [id]);
    res.json({ message: 'Quality Shift Report berhasil dihapus' });
  } catch (err) {
    console.error('deleteShiftReport error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createShiftReport,
  getAllShiftReports,
  getShiftReportById,
  updateShiftReport,
  deleteShiftReport,
};
