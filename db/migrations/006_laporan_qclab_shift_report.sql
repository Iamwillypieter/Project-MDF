-- ============================================================
-- TABEL: laporan_qclab_shift_report
-- Deskripsi: Quality Shift Report — In-Process Testing
--   1 row = 1 dokumen laporan shift QC Lab
-- Form: Header + Tabel Chips Moisture + Tabel Bulk Density
--       + Tabel Glue Mix Analysis
-- ============================================================

CREATE TABLE IF NOT EXISTS laporan_qclab_shift_report (
  id            SERIAL  PRIMARY KEY,
  created_by    INTEGER REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- ── Status Laporan ─────────────────────────────────────────
  -- 'draft' | 'submitted' | 'approved'
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted', 'approved')),

  -- ── Header / Metadata ──────────────────────────────────────
  tanggal       DATE    NOT NULL,
  shift_group   VARCHAR(50),                          -- Shift / Group
  nik_nama_1    VARCHAR(100),                         -- NIK/Nama pemeriksa 1
  nik_nama_2    VARCHAR(100),                         -- NIK/Nama pemeriksa 2
  kondisi_lampu VARCHAR(10) DEFAULT 'OK'              -- 'OK' | 'Not OK'
                  CHECK (kondisi_lampu IN ('OK', 'Not OK')),
  lokasi_kerja  VARCHAR(20) DEFAULT 'Bersih'          -- 'Bersih' | 'Tidak Bersih'
                  CHECK (lokasi_kerja IN ('Bersih', 'Tidak Bersih')),

  -- ── Tabel 1: Chips Moisture Content & pH ───────────────────
  -- JSONB array of objects:
  -- [{
  --   "nomor":        1,
  --   "container_weight":   null,   -- [a] gram
  --   "wet_chips_weight":   null,   -- [b] gram
  --   "cont_dry_chips":     null,   -- [c] gram
  --   "moisture_content":   null,   -- % (auto: ((b-(c-a))/b)*100 atau manual)
  --   "ph":                 null
  -- }]
  chips_moisture  JSONB NOT NULL DEFAULT '[]',

  -- ── Tabel 2: Chips Bulk Density ────────────────────────────
  -- JSONB array of objects:
  -- [{
  --   "nomor":              1,
  --   "wet_chips_weight":   null,   -- gram
  --   "bulk_density_wet":   null,   -- KG/M³ (kalkulasi atau input)
  --   "bulk_density_dry":   null,   -- KG/M³ (kalkulasi atau input)
  --   "species_of_wood":    ""
  -- }]
  chips_bulk_density  JSONB NOT NULL DEFAULT '[]',

  -- ── Tabel 3: Glue Mix Analysis ─────────────────────────────
  -- JSONB object:
  -- {
  --   "time_in":  "08:00",
  --   "time_out": "16:00",
  --   "samples": [
  --     {
  --       "row_label":    "Row 1",
  --       "foil_weight":  null,       -- [a] gram
  --       "gluemix_weight": null,     -- [b] gram
  --       "foil_dry_glue":  null,     -- [c] gram
  --       "solid_content":  null,     -- % auto: ((c-a)/b)*100
  --       "remark":         ""
  --     }
  --   ],
  --   "solid_content_avg": null,      -- rata-rata solid content
  --   "viscosity":    null,           -- cps
  --   "temp":         null,           -- °C
  --   "density":      null,           -- kg/m³
  --   "ph":           null
  -- }
  glue_mix  JSONB NOT NULL DEFAULT '{}',

  -- ── Tabel 4: Hardener, Wax & Dynasteam ────────────────────
  -- JSONB array of objects:
  -- [{
  --   "time":        "08:00",
  --   "hardener_pct": null,   -- % Hardener on OD Glue
  --   "wax_pct":      null,   -- % Wax on OD Fibre
  --   "dynasteam_atas":  null,
  --   "dynasteam_bawah": null
  -- }]
  hardener_wax  JSONB NOT NULL DEFAULT '[]',

  -- ── Tabel 5: Screen Test & MC Fiber ───────────────────────
  -- JSONB object: { time_sampling, discharge_screw, blowline_opening,
  --   steam_flow, refiner_load, digester_level, digester_pressure,
  --   refiner_level, cooking_level, mc_quadra_beam, mc_test_lab_qc,
  --   mesh_rows: [{ mesh_size, weight_sample, weight_dist, spec }] }
  screen_test   JSONB NOT NULL DEFAULT '{}',

  -- ── Tabel 6: Thickness and Density Distribution ────────────
  -- JSONB array: [{ nomor, time_sampling, od_glue, fibre_mc, set_weight,
  --   target_density, avg_density, target_thick, min_thick, max_thick,
  --   avg_thick, length_board, width_board }]
  thick_density JSONB NOT NULL DEFAULT '[]',

  -- ── Tabel 7: Press & Process Parameters ────────────────────
  -- JSONB array: [{ nomor, temp_inlet_press, speed_press,
  --   max_density, min_core_density, ratio_dens,
  --   ib_average, ib_minimum, heating_1..4 }]
  press_params  JSONB NOT NULL DEFAULT '[]',

  -- ── Section 8: Board MC, Physical Test, Swelling ───────────
  -- JSONB object: { board_mc: [...], sh_face, sh_edge, geltime,
  --   swelling: [{ no, weight_0h, thick_0h, weight_24h, thick_24h,
  --                absorption_pct, swelling_pct }] }
  section8      JSONB NOT NULL DEFAULT '{}'
);

-- Index
CREATE INDEX IF NOT EXISTS idx_qclab_shift_tanggal ON laporan_qclab_shift_report(tanggal);
CREATE INDEX IF NOT EXISTS idx_qclab_shift_status  ON laporan_qclab_shift_report(status);
CREATE INDEX IF NOT EXISTS idx_qclab_shift_created_by ON laporan_qclab_shift_report(created_by);
