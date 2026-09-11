const { pool } = require('./db');
const bcrypt = require('bcryptjs');

const initDb = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'produksi', 'sending', 'qc_lab')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Update role constraint — tambah qc_lab (idempotent, lebih robust)
    // Drop constraint lama berdasarkan nama, lalu tambah yang baru
    await pool.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        -- Cari nama constraint check untuk kolom role di tabel users
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%role%';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || quote_ident(constraint_name);
        END IF;

        -- Tambahkan constraint baru yang mencakup qc_lab
        ALTER TABLE users ADD CONSTRAINT users_role_check
          CHECK (role IN ('admin', 'produksi', 'sending', 'qc_lab'));
      EXCEPTION
        WHEN duplicate_object THEN
          -- Constraint sudah ada dengan nama users_role_check, skip
          NULL;
      END $$;
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

    // Create laporan_sanding table (Hasil Sanding / Grading MDF)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_sanding (
        id               SERIAL PRIMARY KEY,
        created_by       INTEGER REFERENCES users(id),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ukuran_tebal     NUMERIC NOT NULL,
        tanggal_produksi DATE NOT NULL,
        "group"          VARCHAR(50) NOT NULL,
        grading          JSONB NOT NULL DEFAULT '{}',
        keterangan       TEXT,
        hambatan         JSONB NOT NULL DEFAULT '[]'
      );
    `);

    // Create laporan_kertas_pasir table (Pemakaian Kertas Pasir)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_kertas_pasir (
        id         SERIAL PRIMARY KEY,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tanggal    DATE NOT NULL,
        transaksi  JSONB NOT NULL DEFAULT '[]',
        keterangan TEXT
      );
    `);

    // Create laporan_qclab table (Laporan Kualitas / Pengujian QC)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_qclab (
        id              SERIAL PRIMARY KEY,
        created_by      INTEGER REFERENCES users(id),
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tanggal         DATE NOT NULL,
        no_sampel       VARCHAR(50) NOT NULL,
        produk          VARCHAR(100) NOT NULL,
        tebal           NUMERIC,
        shift           VARCHAR(10),
        hasil_uji       JSONB NOT NULL DEFAULT '[]',
        keterangan_umum TEXT
      );
    `);

    // Create laporan_qclab_shift_report table (Quality Shift Report — In-Process Testing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_qclab_shift_report (
        id            SERIAL  PRIMARY KEY,
        created_by    INTEGER REFERENCES users(id),
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'submitted', 'approved')),
        tanggal       DATE    NOT NULL,
        shift_group   VARCHAR(50),
        nik_nama_1    VARCHAR(100),
        nik_nama_2    VARCHAR(100),
        kondisi_lampu VARCHAR(10) DEFAULT 'OK'
                        CHECK (kondisi_lampu IN ('OK', 'Not OK')),
        lokasi_kerja  VARCHAR(20) DEFAULT 'Bersih'
                        CHECK (lokasi_kerja IN ('Bersih', 'Tidak Bersih')),
        chips_moisture      JSONB NOT NULL DEFAULT '[]',
        chips_bulk_density  JSONB NOT NULL DEFAULT '[]',
        glue_mix            JSONB NOT NULL DEFAULT '{}',
        hardener_wax        JSONB NOT NULL DEFAULT '[]',
        screen_test         JSONB NOT NULL DEFAULT '{}',
        thick_density       JSONB NOT NULL DEFAULT '[]',
        press_params        JSONB NOT NULL DEFAULT '[]',
        section8            JSONB NOT NULL DEFAULT '{}'
      );
    `);

    await pool.query(`
      ALTER TABLE laporan_qclab_shift_report
        ADD COLUMN IF NOT EXISTS hardener_wax JSONB NOT NULL DEFAULT '[]';
    `);

    await pool.query(`
      ALTER TABLE laporan_qclab_shift_report
        ADD COLUMN IF NOT EXISTS screen_test   JSONB NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS thick_density JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS press_params  JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS section8      JSONB NOT NULL DEFAULT '{}';
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_qclab_shift_tanggal ON laporan_qclab_shift_report(tanggal);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_qclab_shift_status ON laporan_qclab_shift_report(status);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_qclab_shift_created_by ON laporan_qclab_shift_report(created_by);
    `);

    // Create laporan_daily_test_sanding table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laporan_daily_test_sanding (
        id                  SERIAL  PRIMARY KEY,
        created_by          INTEGER REFERENCES users(id),
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'submitted', 'approved')),
        -- Header
        date_of_sanding     DATE    NOT NULL,
        date_of_production  DATE,
        shift_group         VARCHAR(50),
        tester              VARCHAR(100),
        shift_group_2       VARCHAR(50),
        time                VARCHAR(10),
        board_thickness     VARCHAR(30),
        -- Data tables (JSONB)
        board_density       JSONB NOT NULL DEFAULT '[]',
        physical_test       JSONB NOT NULL DEFAULT '[]',
        board_mc            JSONB NOT NULL DEFAULT '[]',
        swelling            JSONB NOT NULL DEFAULT '[]',
        remarks             TEXT
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_test_sanding_date
        ON laporan_daily_test_sanding(date_of_sanding);
    `);

    // Tambah kolom idempotent untuk tabel yang sudah ada (dari versi lama)
    await pool.query(`
      ALTER TABLE laporan_daily_test_sanding
        ADD COLUMN IF NOT EXISTS shift VARCHAR(50);
    `);

    await pool.query(`
      ALTER TABLE laporan_daily_test_sanding
        ADD COLUMN IF NOT EXISTS sortir_ulang JSONB NOT NULL DEFAULT '[]';
    `);

    // Insert default users if not exist
    const defaultUsers = [
      { name: 'Administrator',  username: 'admin',    password: 'admin123',    role: 'admin' },
      { name: 'Staff Produksi', username: 'produksi', password: 'produksi123', role: 'produksi' },
      { name: 'Staff Sending',  username: 'sending',  password: 'sending123',  role: 'sending' },
      { name: 'Staff QC Lab',   username: 'qclab',    password: 'qclab123',    role: 'qc_lab' },
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
