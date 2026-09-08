import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import { APP_NAME } from '../utils/constants';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, automatically redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Login berhasil! Selamat datang kembali.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.message || 'Gagal login. Periksa kembali email & kata sandi.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page-split">
      <div className="login-split-card page-transition">
        {/* Left Side: Clean Login Form */}
        <div className="login-form-side">
          <div className="login-brand-header">
            <div className="login-brand-badge">T</div>
            <h2>Welcome back!</h2>
            <p>Kelola sistem bimbingan belajar {APP_NAME} dengan produktif dan mudah.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Input
              label="Email Pengguna"
              type="email"
              placeholder="example@login.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Masukkan kata sandi..."
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#db2777', textDecoration: 'none', fontWeight: 600 }}>
                Lupa Kata Sandi?
              </Link>
            </div>

            <Button
              type="submit"
              className="btn btn-primary-pink"
              style={{ width: '100%', borderRadius: '9999px', padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem' }}
              loading={loading}
              loadingText="Memverifikasi..."
            >
              Masuk Akun
            </Button>
          </form>

          <div style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} Bimbel {APP_NAME}. Hak cipta dilindungi.
          </div>
        </div>

        {/* Right Side: Modern Computer login-amico.svg Illustration Hero Panel */}
        <div className="login-hero-side" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fdf2f8 100%)' }}>
          <div className="hero-illustration-wrapper">
            <img
              src="/Computer login-amico.svg"
              alt="Login Illustration"
              style={{ width: '100%', maxWidth: '340px', height: 'auto', filter: 'drop-shadow(0 15px 25px rgba(244, 114, 182, 0.15))' }}
            />

            <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '320px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                Kelola Pekerjaan Lebih Mudah & Terstruktur
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Pantau perkembangan murid, jadwal mengajar, dan absensi bimbel dalam satu platform terpadu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
