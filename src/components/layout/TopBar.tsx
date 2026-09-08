import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell, User, LogOut, ChevronDown, Mail, Edit2, KeyRound, Check, X, Menu } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { api } from '../../api/client';
import { toast } from 'react-hot-toast';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Profile Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Sync edit fields when modal opens or user updates
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user, profileModalOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    const capitalized = path.charAt(0).toUpperCase() + path.slice(1);
    return `Dashboard / ${capitalized}`;
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Berhasil keluar akun. Sampai jumpa kembali!');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  const handleSaveProfileField = async (field: 'name' | 'email') => {
    if (field === 'name' && !editName.trim()) {
      toast.error('Nama lengkap tidak boleh kosong');
      return;
    }
    if (field === 'email' && (!editEmail.trim() || !editEmail.includes('@'))) {
      toast.error('Format email tidak valid');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
      });
      toast.success(`Berhasil memperbarui ${field === 'name' ? 'nama' : 'email'}!`);
      if (field === 'name') setIsEditingName(false);
      if (field === 'email') setIsEditingEmail(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendResetPasswordEmail = async () => {
    const targetEmail = user?.email || editEmail;
    if (!targetEmail) {
      toast.error('Email pengguna tidak ditemukan');
      return;
    }

    setSendingReset(true);
    try {
      await api.request('auth/forgot-password', { email: targetEmail });
      toast.success(`Link ganti kata sandi telah dikirim ke ${targetEmail}! Silakan cek kotak masuk email Anda.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onToggleSidebar}
          className="mobile-burger-btn"
          aria-label="Open Sidebar Menu"
        >
          <Menu size={22} color="var(--text-main)" />
        </button>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {user?.name || 'Owner Bimbel'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--primary-pink)', fontWeight: 500 }}>{getBreadcrumbs()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="search-input-wrapper">
          <Search size={16} className="search-input-icon" />
          <input type="text" placeholder="Cari siswa, mapel, jadwal..." />
        </div>

        <button className="btn btn-secondary" style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}>
          <Bell size={18} />
        </button>

        {/* Profile Avatar Dropdown */}
        <div ref={menuRef} style={{ position: 'relative', borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* Default Avatar Kosong */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <User size={20} />
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'Owner Bimbel'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {user?.role === 'admin' ? 'admin' : 'guru'}
              </div>
            </div>

            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </div>

          {/* User Popover Menu */}
          {dropdownOpen && (
            <div
              className="no-scrollbar"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 220,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                padding: '0.5rem',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'Owner Bimbel'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || 'admin@tikatrack.id'}</div>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setProfileModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', padding: '0.5rem 0.75rem', fontWeight: 500 }}
              >
                <User size={16} color="var(--primary-pink)" />
                <span>Manajemen Profil</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="btn btn-danger"
                style={{ width: '100%', justifyContent: 'flex-start', background: '#fef2f2', padding: '0.5rem 0.75rem', fontWeight: 500 }}
              >
                <LogOut size={16} />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Manajemen Profil */}
      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Profil Pengguna">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fdf2f8', padding: '1rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#ffffff', border: '1px solid var(--primary-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-pink)' }}>
              <User size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{user?.name || 'Owner Bimbel'}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email || 'admin@tikatrack.id'}</p>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#fbcfe8', color: '#9d174d', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontWeight: 600 }}>
              {user?.role === 'admin' ? 'Administrator' : 'Guru'}
            </span>
          </div>

          {/* Edit Nama Field dengan Pensil */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Nama Lengkap
            </label>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Input
                  value={editName}
                  onChange={(e: any) => setEditName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  style={{ flex: 1 }}
                />
                <Button
                  className="btn btn-primary-pink"
                  style={{ padding: '0.65rem' }}
                  onClick={() => handleSaveProfileField('name')}
                  loading={savingProfile}
                >
                  <Check size={16} />
                </Button>
                <Button
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem' }}
                  onClick={() => {
                    setEditName(user?.name || '');
                    setIsEditingName(false);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>{user?.name || 'Owner Bimbel'}</span>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-pink)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Edit2 size={15} />
                  <span>Ubah</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Email Field dengan Pensil */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Alamat Email (Database)
            </label>
            {isEditingEmail ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e: any) => setEditEmail(e.target.value)}
                  placeholder="nama@tikatrack.id"
                  style={{ flex: 1 }}
                />
                <Button
                  className="btn btn-primary-pink"
                  style={{ padding: '0.65rem' }}
                  onClick={() => handleSaveProfileField('email')}
                  loading={savingProfile}
                >
                  <Check size={16} />
                </Button>
                <Button
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem' }}
                  onClick={() => {
                    setEditEmail(user?.email || '');
                    setIsEditingEmail(false);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>{user?.email || 'admin@tikatrack.id'}</span>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-pink)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Edit2 size={15} />
                  <span>Ubah</span>
                </button>
              </div>
            )}
          </div>

          {/* Password Field Blur / Obscured dengan Kirim Reset Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Kata Sandi (Password)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '1rem',
                    letterSpacing: '0.25rem',
                    filter: 'blur(3.5px)',
                    userSelect: 'none',
                    fontWeight: 700,
                    color: '#475569',
                  }}
                >
                  ••••••••••••
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', filter: 'none' }}>
                  (Terproteksi)
                </span>
              </div>

              <Button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: '0.35rem', color: 'var(--primary-pink)', borderColor: 'var(--primary-pink)' }}
                onClick={handleSendResetPasswordEmail}
                loading={sendingReset}
                loadingText="Mengirim..."
              >
                <Mail size={14} />
                <span>Ganti via Email</span>
              </Button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: 0 }}>
              Untuk keamanan akun, ganti kata sandi dilakukan dengan mengirim tautan pemulihan resmi ke email Anda.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button className="btn btn-secondary" onClick={() => setProfileModalOpen(false)}>
              Tutup Modal Profil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Peringatan Sign Out (Logout Confirmation Warning) */}
      <Modal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Konfirmasi Keluar Akun">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '1rem', borderRadius: 'var(--radius-xl)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <LogOut size={24} color="var(--danger)" />
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#991b1b' }}>Apakah Anda yakin ingin keluar?</h4>
              <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.1rem' }}>Sesi aktif Anda akan diakhiri. Anda perlu login kembali untuk mengakses sistem.</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button className="btn btn-secondary" onClick={() => setLogoutModalOpen(false)}>
              Batal
            </Button>
            <Button className="btn btn-danger" loading={loggingOut} loadingText="Keluar..." onClick={handleConfirmLogout}>
              Ya, Keluar Akun
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
export default TopBar;
