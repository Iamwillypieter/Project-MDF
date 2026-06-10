-- ============================================================
-- TABEL: laporan_produksi_mdf
-- Deskripsi: Laporan Produksi MDF — 1 row = 1 dokumen utuh
-- Form: Parameter produksi sisi KIRI & KANAN + tabel hambatan
-- ============================================================

CREATE TABLE IF NOT EXISTS laporan_produksi_mdf (
  id                   SERIAL  PRIMARY KEY,
  created_by           INTEGER REFERENCES users(id),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- ── Sisi KIRI ──────────────────────────────────────────────
  kiri_raw_thickness   NUMERIC,                 -- Raw. Thickness (Mm)
  kiri_fin_thickness   NUMERIC,                 -- Fin. Thickness (Mm)
  kiri_good_board      NUMERIC,                 -- Good Board (Lbr) — input manual
  kiri_m3_goodboard    NUMERIC,                 -- M3 Goodboard — kalkulasi otomatis
  kiri_total_reject    NUMERIC,                 -- Total Reject (Lbr) — input manual
  kiri_m3_reject       NUMERIC,                 -- M3 Reject — kalkulasi otomatis
  kiri_total_board     NUMERIC,                 -- Total Board (Lbr) = Good Board + Total Reject
  kiri_total_board_m3  NUMERIC,                 -- Total Board (M3) = M3 Goodboard + M3 Reject
  kiri_gluemix         NUMERIC,                 -- Gluemix (Ltr)
  kiri_paraffin        NUMERIC,                 -- Paraffin (Kg/Ltr)
  kiri_fibre           NUMERIC,                 -- Fibre (Kg/Ltr)
  kiri_wood            NUMERIC,                 -- Wood (Kg)
  kiri_jenis           VARCHAR(20),             -- Jenis: Rmbg | Std | E2 | P2 | HMR

  -- ── Sisi KANAN ─────────────────────────────────────────────
  kanan_raw_thickness  NUMERIC,
  kanan_fin_thickness  NUMERIC,
  kanan_good_board     NUMERIC,
  kanan_m3_goodboard   NUMERIC,
  kanan_total_reject   NUMERIC,
  kanan_m3_reject      NUMERIC,
  kanan_total_board    NUMERIC,
  kanan_total_board_m3 NUMERIC,
  kanan_gluemix        NUMERIC,
  kanan_paraffin       NUMERIC,
  kanan_fibre          NUMERIC,
  kanan_wood           NUMERIC,
  kanan_jenis          VARCHAR(20),

  -- ── Tabel Hambatan (dinamis) ────────────────────────────────
  -- JSONB array of objects:
  -- [{ "dari": "08:00", "sampai": "09:00", "keterangan": "...",
  --    "bagian": "...", "dilaporkan_oleh": "..." }]
  hambatan             JSONB NOT NULL DEFAULT '[]'
);

-- Rumus kalkulasi otomatis (dilakukan di frontend saat render):
--   M3 Goodboard  = (good_board  * fin_thickness * 2.44 * 3.66) / 1000
--   M3 Reject     = (total_reject * fin_thickness * 2.44 * 3.66) / 1000
--   Total Board (Lbr) = good_board + total_reject
--   Total Board (M3)  = M3 Goodboard + M3 Reject
