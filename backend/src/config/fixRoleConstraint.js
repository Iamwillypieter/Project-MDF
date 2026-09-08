/**
 * fixRoleConstraint.js
 * Script satu kali untuk memperbaiki CHECK constraint role di tabel users.
 * Jalankan: node src/config/fixRoleConstraint.js
 */
require('dotenv').config();
const { pool } = require('./db');

const fix = async () => {
  try {
    console.log('Memeriksa constraint role di tabel users...');

    // Lihat semua constraint check yang ada di tabel users
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND contype = 'c'
    `);

    console.log('Constraint yang ditemukan:');
    constraints.rows.forEach(r => console.log(` - ${r.conname}: ${r.def}`));

    // Drop semua constraint check yang ada (yang berkaitan dengan role)
    for (const row of constraints.rows) {
      if (row.def.includes('role')) {
        console.log(`Dropping constraint: ${row.conname}`);
        await pool.query(`ALTER TABLE users DROP CONSTRAINT ${row.conname}`);
      }
    }

    // Tambahkan constraint baru yang lengkap
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'produksi', 'sending', 'qc_lab'))
    `);

    console.log('✅ Constraint berhasil diupdate: role IN (admin, produksi, sending, qc_lab)');

    // Verifikasi
    const verify = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND contype = 'c'
    `);
    console.log('Constraint sekarang:');
    verify.rows.forEach(r => console.log(` ✔ ${r.conname}: ${r.def}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
};

fix();
