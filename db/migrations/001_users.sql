-- ============================================================
-- TABEL: users
-- Deskripsi: Akun pengguna sistem dengan 3 role
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,                        -- bcrypt hash
  role       VARCHAR(20)  NOT NULL
               CHECK (role IN ('admin', 'produksi', 'sending', 'qc_lab')),
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk login lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
