-- ============================================================
-- TABEL: laporan_chipper_mdf
-- Deskripsi: Laporan Chipper MDF — 1 row = 1 dokumen utuh
-- Form: Data Log & Bungker (dinamis) + Tabel Hambatan
-- ============================================================

CREATE TABLE IF NOT EXISTS laporan_chipper_mdf (
  id         SERIAL  PRIMARY KEY,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- ── Data Log & Bungker (dinamis) ───────────────────────────
  -- JSONB array of objects:
  -- [{
  --   "shift":               "Pagi",
  --   "log_rambung":         1500,     -- Kg
  --   "bungker_jam":         "08:00",
  --   "bungker_201":         80,
  --   "bungker_202":         75,
  --   "bahan_bakar_barkmill":"Solar",
  --   "keterangan":          "..."
  -- }]
  data_log   JSONB NOT NULL DEFAULT '[]',

  -- ── Tabel Hambatan (dinamis) ────────────────────────────────
  -- JSONB array of objects:
  -- [{ "dari": "08:00", "sampai": "09:00", "keterangan": "...",
  --    "bagian": "...", "dilaporkan_oleh": "..." }]
  hambatan   JSONB NOT NULL DEFAULT '[]'
);
