-- ============================================================
-- TABEL: laporan_imal
-- Deskripsi: Pemakaian Bahan Baku / Shift (IMAL)
--            1 row = 1 dokumen utuh
-- Form: Tabel shift dengan 3 baris per shift (Awal, Pakai, Akhir)
--       + digital sign-off (Dilapor Operator & Diperiksa Shift Leader)
-- ============================================================

CREATE TABLE IF NOT EXISTS laporan_imal (
  id         SERIAL  PRIMARY KEY,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- ── Data shift (dinamis) ────────────────────────────────────
  -- JSONB array of shift-blocks:
  -- [{
  --   "shift": "Pagi",
  --   "rows": [
  --     { "keterangan": "Awal",  "material": "Urea", "glue": 200, "wax": 50 },
  --     { "keterangan": "Pakai", "material": "Urea", "glue": 180, "wax": 45 },
  --     { "keterangan": "Akhir", "material": "Urea", "glue": 20,  "wax": 5  }
  --   ],
  --   "dilaporkan_operator": "Budi Santoso",   -- otomatis dari user login
  --   "diperiksa_status":    "pending",         -- "pending" | "verified"
  --   "diperiksa_oleh":      "",                -- diisi backend saat verifikasi
  --   "diperiksa_at":        ""                 -- ISO timestamp verifikasi
  -- }]
  shifts     JSONB NOT NULL DEFAULT '[]'
);

-- Endpoint verifikasi: PATCH /api/laporan-imal/:id/verifikasi
-- Hanya bisa dilakukan oleh role 'admin'
-- Mengupdate semua shift-block: diperiksa_status = 'verified'
