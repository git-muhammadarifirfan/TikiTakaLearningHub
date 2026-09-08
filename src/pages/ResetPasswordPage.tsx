import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const token = pathToken || queryToken || '';

  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Semua kolom kata sandi wajib diisi.');
      return;
    }
    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!token) {
      toast.error('Token reset tidak valid atau sudah kadaluarsa.');
      return;
    }

    setLoading(true);
    try {
      await api.request<{ message: string }>('auth/reset-password', { password, token });
      toast.success('Kata sandi berhasil diperbarui!');
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-split">
      <div className="login-split-card page-transition">
        {/* Left Side: Form */}
        <div className="login-form-side">
          <div className="login-brand-header">
            <div className="login-brand-badge">T</div>
            <h2>Buat Kata Sandi Baru</h2>
            <p>Masukkan kata sandi baru untuk melindungi akun Anda.</p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 56, height: 56, background: '#f0fdf4', color: '#16a34a',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                Kata Sandi Berhasil Diperbarui!
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Silakan login menggunakan kata sandi baru Anda.
              </p>
              <Link
                to="/login"
                className="btn btn-primary-pink"
                style={{ width: '100%', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
              >
                <ArrowLeft size={16} />
                <span>Lanjut ke Halaman Login</span>
              </Link>
            </div>
          ) : !token ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 56, height: 56, background: '#fef2f2', color: '#dc2626',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <Lock size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700, color: '#dc2626' }}>
                Token Reset Tidak Valid
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Link reset kata sandi ini tidak valid atau sudah kadaluarsa. Silakan minta link baru.
              </p>
              <Link
                to="/forgot-password"
                className="btn btn-primary-pink"
                style={{ width: '100%', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
              >
                <span>Minta Link Reset Baru</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Input
                label="Kata Sandi Baru"
                type="password"
                placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                placeholder="Ulangi kata sandi baru..."
                value={confirmPassword}
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />

              {password && confirmPassword && password !== confirmPassword && (
                <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '-0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  ⚠ Konfirmasi kata sandi tidak cocok.
                </div>
              )}

              <Button
                type="submit"
                className="btn btn-primary-pink"
                style={{ width: '100%', borderRadius: '9999px', padding: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}
                disabled={loading || (password !== confirmPassword)}
              >
                {loading ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
              </Button>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    fontSize: '0.875rem', color: '#64748b', textDecoration: 'none',
                    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Batal & Kembali ke Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Hero Illustration */}
        <div className="login-hero-side" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fdf2f8 100%)' }}>
          <div className="hero-illustration-wrapper">
            <img
              src="/Computer login-amico.svg"
              alt="Reset Password Illustration"
              style={{ width: '100%', maxWidth: '320px', height: 'auto', filter: 'drop-shadow(0 15px 25px rgba(244, 114, 182, 0.15))' }}
            />

            <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '300px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                Keamanan Akun Terjamin
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Gunakan kombinasi kata sandi yang kuat untuk menjaga keamanan data bimbel Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResetPasswordPage;
