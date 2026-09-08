import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';
import { Button, Input, Modal, Select, SkeletonBox } from '../../components/ui';
import { Plus, Edit2, UserCheck, Shield, Search, Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

const getRoleColor = (role: string) => {
  if (role === 'admin') return { bg: '#fdf2f8', color: '#9d174d', border: '#fbcfe8' };
  return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
};

const getAvatarSvg = (index: number, role: string) => {
  const bgColors = ['#fce7f3', '#e0e7ff', '#d1fae5', '#fef9c3', '#ffedd5', '#f3e8ff'];
  const bg = bgColors[index % bgColors.length];
  const isAdmin = role === 'admin';
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: isAdmin ? '2px solid #ec4899' : '2px solid transparent',
    }}>
      {isAdmin ? <Shield size={18} color="#ec4899" /> : <UserCheck size={18} color="#16a34a" />}
    </div>
  );
};

export const TeacherListPage: React.FC = () => {
  const cachedTeachers = api.getCached<User[]>('teachers/list');
  const [teachers, setTeachers] = useState<User[]>(cachedTeachers || []);
  const [loading, setLoading] = useState(!cachedTeachers);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('aktif');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeachers = async () => {
    try {
      const data = await api.request<User[]>('teachers/list', undefined, { skipCache: true });
      setTeachers(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar pengajar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('guru');
    setPhone('');
    setStatus('aktif');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword('');
    setRole(user.role || 'guru');
    setPhone(user.phone || '');
    setStatus(user.status || 'aktif');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Nama dan email wajib diisi');
      return;
    }

    const isEdit = !!editingUser;
    setSubmitting(true);
    const toastId = toast.loading(isEdit ? 'Menyimpan perubahan...' : 'Mendaftarkan akun baru...');

    try {
      api.invalidateCache();
      if (isEdit && editingUser) {
        await api.request('teachers/update', {
          userId: editingUser.user_id,
          name,
          email,
          role,
          phone,
          status,
        });
        toast.success('Data berhasil diperbarui!', { id: toastId });
      } else {
        if (!password) {
          toast.error('Kata sandi wajib diisi untuk akun baru', { id: toastId });
          setSubmitting(false);
          return;
        }
        await api.request<User>('teachers/create', { name, email, password, role, phone });
        toast.success('Akun berhasil didaftarkan!', { id: toastId });
      }
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = teachers.filter((t) => t.role === 'admin').length;
  const guruCount = teachers.filter((t) => t.role === 'guru').length;

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Guru & Administrator</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dashboard / <span style={{ color: 'var(--primary-pink)' }}>Kelola Akun</span>
          </p>
        </div>
        <Button className="btn btn-primary-pink" onClick={openAddModal}>
          <Plus size={16} />
          <span>Daftarkan Akun Baru</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', margin: 0 }}>
        <div className="stat-card" style={{ background: '#fdf2f8', borderColor: '#fbcfe8' }}>
          <div className="stat-icon" style={{ background: '#f472b6', color: '#fff' }}>
            <Shield size={20} />
          </div>
          <div className="stat-info">
            <p style={{ color: '#9d174d', fontSize: '0.78rem', fontWeight: 500 }}>Admin</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#9d174d' }}>{adminCount}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#166534' }}>
            <UserCheck size={20} />
          </div>
          <div className="stat-info">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>Guru Pengampu</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{guruCount}</h3>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* Search */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="search-input-wrapper" style={{ width: '300px' }}>
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Cari nama, email, atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Akun</th>
                <th>Email</th>
                <th>No. Telepon</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><SkeletonBox width="40px" height="40px" borderRadius="50%" /><div><SkeletonBox width="120px" height="16px" /><SkeletonBox width="60px" height="12px" style={{ marginTop: 4 }} /></div></div></td>
                    <td><SkeletonBox width="140px" height="16px" /></td>
                    <td><SkeletonBox width="100px" height="16px" /></td>
                    <td><SkeletonBox width="70px" height="24px" borderRadius="9999px" /></td>
                    <td><SkeletonBox width="50px" height="24px" borderRadius="9999px" /></td>
                    <td><SkeletonBox width="60px" height="28px" borderRadius="var(--radius-md)" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada data akun yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const rc = getRoleColor(t.role);
                  return (
                    <tr key={t.user_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {getAvatarSvg(idx, t.role)}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{t.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-main)' }}>
                          <Mail size={13} color="var(--text-muted)" />
                          <span>{t.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          <Phone size={13} />
                          <span>{t.phone || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: rc.bg,
                          color: rc.color,
                          border: `1px solid ${rc.border}`,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}>
                          {t.role === 'admin' ? 'Administrator' : 'Guru'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: t.status === 'aktif' ? '#d1fae5' : '#fee2e2',
                          color: t.status === 'aktif' ? '#065f46' : '#991b1b',
                        }}>
                          {t.status || 'aktif'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => openEditModal(t)}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        title={editingUser ? `Edit Akun: ${editingUser.name}` : 'Daftarkan Akun Baru'}
      >
        <form onSubmit={handleSave}>
          <div style={{ background: '#fdf2f8', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: '#9d174d', marginBottom: '1rem' }}>
            {editingUser
              ? 'Perbarui data profil akun ini. Kata sandi tidak dapat diubah dari sini.'
              : 'Isi data akun baru untuk guru pengampu atau administrator.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Input label="Nama Lengkap *" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Nama lengkap" required />
            <Input label="Email Login *" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="email@contoh.com" required />
          </div>

          {!editingUser && (
            <Input label="Kata Sandi *" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required />
          )}

          {editingUser && (
            <div style={{
              background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-lg)',
              fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem',
              border: '1px dashed var(--border)',
            }}>
              🔒 Kata sandi tidak ditampilkan dan tidak dapat diubah dari halaman ini. Gunakan fitur "Lupa Kata Sandi" untuk reset.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
            <Select
              label="Role Akses"
              value={role}
              onChange={(val) => setRole(val as UserRole)}
              options={[
                { value: 'guru', label: 'Guru Pengampu' },
                { value: 'admin', label: 'Administrator' },
              ]}
            />
            <Input label="No. Telepon / WhatsApp" value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="081234567890" />
          </div>

          {editingUser && (
            <div style={{ marginTop: '0.5rem' }}>
              <Select
                label="Status Akun"
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: 'aktif', label: 'Aktif' },
                  { value: 'nonaktif', label: 'Nonaktif' },
                ]}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              {editingUser ? 'Simpan Perubahan' : 'Daftarkan Akun'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TeacherListPage;
