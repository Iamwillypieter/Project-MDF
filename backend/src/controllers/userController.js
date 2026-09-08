const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users — ambil semua user
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('GetAllUsers error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// POST /api/users — tambah user baru
const createUser = async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  if (!['produksi', 'sending', 'qc_lab'].includes(role)) {
    return res.status(400).json({ message: 'Role hanya boleh produksi, sending, atau qc_lab' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }

  try {
    // Cek username sudah ada
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, username, role, created_at',
      [name, username, hashedPassword, role]
    );

    res.status(201).json({ message: 'User berhasil dibuat', user: result.rows[0] });
  } catch (err) {
    console.error('CreateUser error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/users/:id — hapus user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Tidak boleh hapus akun admin
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    if (user.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Akun admin tidak bisa dihapus' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('DeleteUser error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/users/:id — update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role } = req.body;

  if (!name || !username || !role) {
    return res.status(400).json({ message: 'Name, username, dan role wajib diisi' });
  }

  if (!['produksi', 'sending', 'qc_lab'].includes(role)) {
    return res.status(400).json({ message: 'Role hanya boleh produksi, sending, atau qc_lab' });
  }

  try {
    // Cek user ada
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    if (user.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Akun admin tidak bisa diubah' });
    }

    // Cek username duplikat (kecuali milik sendiri)
    const duplicate = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, id]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }

    let query, params;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password minimal 6 karakter' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name=$1, username=$2, password=$3, role=$4 WHERE id=$5 RETURNING id, name, username, role, created_at';
      params = [name, username, hashedPassword, role, id];
    } else {
      query = 'UPDATE users SET name=$1, username=$2, role=$3 WHERE id=$4 RETURNING id, name, username, role, created_at';
      params = [name, username, role, id];
    }

    const result = await pool.query(query, params);
    res.json({ message: 'User berhasil diupdate', user: result.rows[0] });
  } catch (err) {
    console.error('UpdateUser error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = { getAllUsers, createUser, deleteUser, updateUser };
