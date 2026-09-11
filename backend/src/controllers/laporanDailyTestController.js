const { pool } = require('../config/db');

const parseJsonb = (val, fallback) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return fallback; }
};

// ── POST /api/laporan-daily-test ──────────────────────────────────────────────
const createDailyTest = async (req, res) => {
  const {
    date_sanding, date_production, shift_group, tester,
    shift, time, board_thickness,
    board_density, physical_test, board_mc, swelling,
    sortir_ulang,
    remarks,
  } = req.body;

  if (!date_sanding) {
    return res.status(400).json({ message: 'Field date_sanding wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO laporan_daily_test_sanding
         (created_by, date_of_sanding, date_of_production, shift_group, tester,
          shift, time, board_thickness,
          board_density, physical_test, board_mc, swelling, sortir_ulang, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, created_at`,
      [
        req.user.id,
        date_sanding,
        date_production || null,
        shift_group     || null,
        tester          || null,
        shift           || null,
        time            || null,
        board_thickness || null,
        JSON.stringify(Array.isArray(board_density)  ? board_density  : []),
        JSON.stringify(Array.isArray(physical_test)  ? physical_test  : []),
        JSON.stringify(Array.isArray(board_mc)       ? board_mc       : []),
        JSON.stringify(Array.isArray(swelling)       ? swelling       : []),
        JSON.stringify(Array.isArray(sortir_ulang)   ? sortir_ulang   : []),
        remarks || '',
      ]
    );
    res.status(201).json({
      message: 'Daily Test Report berhasil disimpan',
      id:         result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('createDailyTest error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── GET /api/laporan-daily-test ───────────────────────────────────────────────
const getAllDailyTests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.created_at,
              r.date_of_sanding    AS date_sanding,
              r.date_of_production AS date_production,
              r.shift_group, r.tester, r.shift, r.time, r.board_thickness,
              u.name AS operator_name
       FROM laporan_daily_test_sanding r
       LEFT JOIN users u ON r.created_by = u.id
       ORDER BY r.created_at DESC`
    );
    res.json({ laporan: result.rows });
  } catch (err) {
    console.error('getAllDailyTests error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── GET /api/laporan-daily-test/:id ──────────────────────────────────────────
const getDailyTestById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id, r.created_at,
              r.date_of_sanding    AS date_sanding,
              r.date_of_production AS date_production,
              r.shift_group, r.tester, r.shift, r.time, r.board_thickness,
              r.board_density, r.physical_test, r.board_mc, r.swelling,
              r.sortir_ulang, r.remarks,
              u.name AS operator_name
       FROM laporan_daily_test_sanding r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const row = result.rows[0];
    row.board_density = parseJsonb(row.board_density, []);
    row.physical_test = parseJsonb(row.physical_test, []);
    row.board_mc      = parseJsonb(row.board_mc,      []);
    row.swelling      = parseJsonb(row.swelling,      []);
    row.sortir_ulang  = parseJsonb(row.sortir_ulang,  []);
    res.json({ laporan: row });
  } catch (err) {
    console.error('getDailyTestById error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── PUT /api/laporan-daily-test/:id ──────────────────────────────────────────
const updateDailyTest = async (req, res) => {
  const { id } = req.params;
  const {
    date_sanding, date_production, shift_group, tester,
    shift, time, board_thickness,
    board_density, physical_test, board_mc, swelling,
    sortir_ulang,
    remarks,
  } = req.body;

  if (!date_sanding) {
    return res.status(400).json({ message: 'Field date_sanding wajib diisi.' });
  }

  try {
    const check = await pool.query(
      'SELECT id FROM laporan_daily_test_sanding WHERE id = $1', [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    const result = await pool.query(
      `UPDATE laporan_daily_test_sanding SET
         date_of_sanding=$1, date_of_production=$2, shift_group=$3, tester=$4,
         shift=$5, time=$6, board_thickness=$7,
         board_density=$8, physical_test=$9, board_mc=$10, swelling=$11,
         sortir_ulang=$12, remarks=$13
       WHERE id=$14 RETURNING id`,
      [
        date_sanding,
        date_production || null,
        shift_group     || null,
        tester          || null,
        shift           || null,
        time            || null,
        board_thickness || null,
        JSON.stringify(Array.isArray(board_density)  ? board_density  : []),
        JSON.stringify(Array.isArray(physical_test)  ? physical_test  : []),
        JSON.stringify(Array.isArray(board_mc)       ? board_mc       : []),
        JSON.stringify(Array.isArray(swelling)       ? swelling       : []),
        JSON.stringify(Array.isArray(sortir_ulang)   ? sortir_ulang   : []),
        remarks || '',
        id,
      ]
    );
    res.json({ message: 'Daily Test Report berhasil diupdate', id: result.rows[0].id });
  } catch (err) {
    console.error('updateDailyTest error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// ── DELETE /api/laporan-daily-test/:id ───────────────────────────────────────
const deleteDailyTest = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query(
      'SELECT id FROM laporan_daily_test_sanding WHERE id = $1', [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    await pool.query('DELETE FROM laporan_daily_test_sanding WHERE id = $1', [id]);
    res.json({ message: 'Daily Test Report berhasil dihapus' });
  } catch (err) {
    console.error('deleteDailyTest error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = {
  createDailyTest, getAllDailyTests, getDailyTestById,
  updateDailyTest, deleteDailyTest,
};
