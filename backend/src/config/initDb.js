const pool = require('./db');

const initDb = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'produksi', 'sending')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create laporan_imal table — 1 row = 1 dokumen utuh, data shifts disimpan JSONB
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_imal (
        id              SERIAL PRIMARY KEY,
        created_by      INTEGER REFERENCES users(id),
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Array of shift-blocks:
        -- [{ shift, glue_awal, glue_akhir, wax_awal, wax_akhir,
        --    dilaporkan_operator, diperiksa_status, diperiksa_oleh, diperiksa_at }]
        shifts          JSONB NOT NULL DEFAULT '[]'
      );
    `);

    // Create laporan_cooling_staking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_cooling_staking (
        id          SERIAL PRIMARY KEY,
        created_by  INTEGER REFERENCES users(id),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rows        JSONB NOT NULL DEFAULT '[]'
      );
    `);

    // Create laporan_chipper_mdf table
    // Bagian log & bungker + hambatan keduanya JSONB agar 1 row = 1 dokumen utuh
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_chipper_mdf (
        id          SERIAL PRIMARY KEY,
        created_by  INTEGER REFERENCES users(id),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Array of objects: {shift, log_rambung, bungker_jam, bungker_201,
        --   bungker_202, bahan_bakar_barkmill, keterangan}
        data_log    JSONB NOT NULL DEFAULT '[]',
        -- Array of objects: {dari, sampai, keterangan, bagian, dilaporkan_oleh}
        hambatan    JSONB NOT NULL DEFAULT '[]'
      );
    `);

    // Create laporan_produksi_mdf table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_produksi_mdf (
        id                    SERIAL PRIMARY KEY,
        created_by            INTEGER REFERENCES users(id),
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        kiri_raw_thickness    NUMERIC,
        kiri_fin_thickness    NUMERIC,
        kiri_good_board       NUMERIC,
        kiri_m3_goodboard     NUMERIC,
        kiri_total_reject     NUMERIC,
        kiri_m3_reject        NUMERIC,
        kiri_total_board      NUMERIC,
        kiri_total_board_m3   NUMERIC,
        kiri_gluemix          NUMERIC,
        kiri_paraffin         NUMERIC,
        kiri_fibre            NUMERIC,
        kiri_wood             NUMERIC,
        kiri_jenis            VARCHAR(20),
        kanan_raw_thickness   NUMERIC,
        kanan_fin_thickness   NUMERIC,
        kanan_good_board      NUMERIC,
        kanan_m3_goodboard    NUMERIC,
        kanan_total_reject    NUMERIC,
        kanan_m3_reject       NUMERIC,
        kanan_total_board     NUMERIC,
        kanan_total_board_m3  NUMERIC,
        kanan_gluemix         NUMERIC,
        kanan_paraffin        NUMERIC,
        kanan_fibre           NUMERIC,
        kanan_wood            NUMERIC,
        kanan_jenis           VARCHAR(20),
        hambatan              JSONB NOT NULL DEFAULT '[]'
      );
    `);

    // Tambah kolom baru ke tabel yang sudah ada (idempotent)
    await pool.query(`
      ALTER TABLE laporan_produksi_mdf
        ADD COLUMN IF NOT EXISTS kiri_m3_goodboard    NUMERIC,
        ADD COLUMN IF NOT EXISTS kiri_total_reject     NUMERIC,
        ADD COLUMN IF NOT EXISTS kiri_m3_reject        NUMERIC,
        ADD COLUMN IF NOT EXISTS kiri_total_board_m3   NUMERIC,
        ADD COLUMN IF NOT EXISTS kanan_m3_goodboard    NUMERIC,
        ADD COLUMN IF NOT EXISTS kanan_total_reject    NUMERIC,
        ADD COLUMN IF NOT EXISTS kanan_m3_reject       NUMERIC,
        ADD COLUMN IF NOT EXISTS kanan_total_board_m3  NUMERIC;
    `);

    // Insert default users if not exist
    const bcrypt = require('bcryptjs');

    const defaultUsers = [
      { name: 'Administrator', username: 'admin', password: 'admin123', role: 'admin' },
      { name: 'Staff Produksi', username: 'produksi', password: 'produksi123', role: 'produksi' },
      { name: 'Staff Sending', username: 'sending', password: 'sending123', role: 'sending' },
    ];

    for (const user of defaultUsers) {
      const exists = await pool.query('SELECT id FROM users WHERE username = $1', [user.username]);
      if (exists.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          'INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4)',
          [user.name, user.username, hashedPassword, user.role]
        );
        console.log(`Default user '${user.username}' created`);
      }
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
};

module.exports = initDb;
