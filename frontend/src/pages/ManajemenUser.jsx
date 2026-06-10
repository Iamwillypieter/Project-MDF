import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import SubmitButton from '../components/ui/SubmitButton';
import TableSkeleton from '../components/ui/TableSkeleton';
import './ManajemenUser.css';

const API_URL = `http://${window.location.hostname}:5000/api`;

const roleLabel = { produksi: 'Produksi', sending: 'Sending', admin: 'Admin' };
const roleBadge = { produksi: 'badge-blue', sending: 'badge-green', admin: 'badge-purple' };

// ─────────────────────────────────────────────────────────────
// Komponen terisolasi: state isSubmitting hidup di sini,
// bukan di parent ManajemenUser — mencegah re-render halaman penuh
// ─────────────────────────────────────────────────────────────
const UserFormModal = ({ editTarget, token, onSuccess, onClose }) => {
  const emptyForm = { name: '', username: '', password: '', role: 'produksi' };
  const [form, setForm] = useState(
    editTarget
      ? { name: editTarget.name, username: editTarget.username, password: '', role: editTarget.role }
      : emptyForm
  );
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // state loading terisolasi di sini

  const headers = { Authorization: `Bearer ${token}` };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true); // set true sebelum hit API

    try {
      if (editTarget) {
        await axios.put(`${API_URL}/users/${editTarget.id}`, form, { headers });
        onSuccess('User berhasil diupdate');
      } else {
        await axios.post(`${API_URL}/users`, form, { headers });
        onSuccess('User berhasil ditambahkan');
      }
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false); // wajib di finally — berhenti baik sukses maupun error
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editTarget ? 'Edit User' : 'Tambah User Baru'}</h3>
          {/* Tombol close dinonaktifkan saat submitting untuk cegah tutup modal di tengah proses */}
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {formError && <div className="form-error">{formError}</div>}

          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Contoh: budi123"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>{editTarget ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={editTarget ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
              required={!editTarget}
              minLength={form.password ? 6 : undefined}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              required
              disabled={isSubmitting}
            >
              <option value="produksi">Produksi</option>
              <option value="sending">Sending</option>
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>

            <SubmitButton
              isSubmitting={isSubmitting}
              label={editTarget ? 'Simpan Perubahan' : 'Tambah User'}
              className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              spinnerClassName="text-white"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Komponen utama halaman — hanya kelola data tabel & modal state
// ─────────────────────────────────────────────────────────────
const ManajemenUser = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);   // loading tabel
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);  // null = tambah, object = edit
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users`, { headers });
      setUsers(res.data.users);
    } catch {
      showToast('Gagal memuat data user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openTambah = () => { setEditTarget(null); setShowModal(true); };
  const openEdit = (user) => { setEditTarget(user); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleFormSuccess = (message) => {
    showToast(message);
    fetchUsers();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/users/${deleteConfirm}`, { headers });
      showToast('User berhasil dihapus');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus user', 'error');
    } finally {
      setIsDeleting(false); // wajib di finally
      setDeleteConfirm(null);
    }
  };

  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const adminUsers = users.filter(u => u.role === 'admin');

  return (
    <div className="dashboard-wrapper">
      <Navbar />

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <main className="dashboard-main">
        <div className="page-header">
          <div>
            <h2>Manajemen User</h2>
            <p>Kelola akun pengguna sistem produksi dan sending</p>
          </div>
          <button className="btn-primary" onClick={openTambah}>
            + Tambah User
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total User</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{users.filter(u => u.role === 'produksi').length}</span>
            <span className="stat-label">Produksi</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{users.filter(u => u.role === 'sending').length}</span>
            <span className="stat-label">Sending</span>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <h3>Daftar User</h3>
            <span className="total-badge">{users.length} user</span>
          </div>

          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user, idx) => (
                    <tr key={user.id} className="row-admin">
                      <td>{idx + 1}</td>
                      <td className="td-name">{user.name}</td>
                      <td><code>{user.username}</code></td>
                      <td><span className={`badge ${roleBadge[user.role]}`}>{roleLabel[user.role]}</span></td>
                      <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                      <td><span className="td-locked">🔒 Terkunci</span></td>
                    </tr>
                  ))}

                  {nonAdminUsers.map((user, idx) => (
                    <tr key={user.id}>
                      <td>{adminUsers.length + idx + 1}</td>
                      <td className="td-name">{user.name}</td>
                      <td><code>{user.username}</code></td>
                      <td><span className={`badge ${roleBadge[user.role]}`}>{roleLabel[user.role]}</span></td>
                      <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="td-actions">
                        <button className="btn-edit" onClick={() => openEdit(user)}>Edit</button>
                        <button className="btn-delete" onClick={() => setDeleteConfirm(user.id)}>Hapus</button>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr><td colSpan={6} className="td-empty">Belum ada user</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Form modal dirender sebagai komponen terpisah — state isSubmitting terisolasi di dalamnya */}
      {showModal && (
        <UserFormModal
          editTarget={editTarget}
          token={token}
          onSuccess={handleFormSuccess}
          onClose={closeModal}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !isDeleting && setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Konfirmasi Hapus</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus user ini? Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              {/* UX Blocking: disabled saat isDeleting */}
              <button className="btn-delete-confirm" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <span className="btn-spinner-wrapper">
                    <Spinner size="sm" className="text-white" />
                    Menghapus...
                  </span>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenUser;
