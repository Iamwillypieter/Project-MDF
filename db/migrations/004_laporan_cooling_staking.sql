-- ============================================================
-- TABEL: laporan_cooling_staking
-- Deskripsi: Laporan Cooling Staking — 1 row = 1 dokumen utuh
-- Form: Tabel dinamis baris per baris data staking
-- ============================================================

CREATE TABLE IF NOT EXISTS laporan_cooling_staking (
  id         SERIAL  PRIMARY KEY,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- ── Baris data staking (dinamis) ───────────────────────────
  -- JSONB array of objects:
  -- [{
  --   "shift":          "Pagi",
  --   "tgl_produksi":   "2025-06-09",
  --   "kode_produksi":  "MDF-001",
  --   "raw_thickness":  18.5,
  --   "no_stack":       "S-01",
  --   "grade_a":        100,
  --   "grade_b":        20,
  --   "alas":           5,
  --   "total_lbr":      125,         -- kalkulasi: grade_a + grade_b + alas
  --   "seksi":          "A",
  --   "kolom":          "3",
  --   "baris":          "2",
  --   "keterangan":     "..."
  -- }]
  rows       JSONB NOT NULL DEFAULT '[]'
);

-- Rumus kalkulasi otomatis (dilakukan di frontend saat render):
--   Total Lbr = Grade A + Grade B + Alas
