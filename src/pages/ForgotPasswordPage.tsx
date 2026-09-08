import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await api.request<{ message: string }>('auth/forgot-password', { email, appUrl: window.location.origin });
      toast.success('Link reset kata sandi telah dikirim ke email!');
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim permintaan reset.');
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
            <h2>Lupa Kata Sandi</h2>
            <p>Masukkan email terdaftar Anda untuk menerima instruksi pemulihan.</p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 56, height: 56, background: '#fdf2f8', color: '#db2777', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Mail size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }}>Cek Email Anda</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Kami telah mengirimkan tautan pemulihan ke <strong>{email}</strong>.
              </p>
              <Link to="/login" className="btn btn-primary-pink" style={{ width: '100%', borderRadius: '9999px' }}>
                <ArrowLeft size={16} />
                <span>Kembali ke Halaman Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Input
                label="Email Terdaftar"
                type="email"
                placeholder="example@login.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <Button type="submit" className="btn btn-primary-pink" style={{ width: '100%', borderRadius: '9999px', padding: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Kirim Tautan...' : 'Kirim Tautan Reset'}
              </Button>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeft size={14} />
                  <span>Kembali ke Login</span>
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
              alt="Forgot Password Illustration"
              style={{ width: '100%', maxWidth: '320px', height: 'auto', filter: 'drop-shadow(0 15px 25px rgba(244, 114, 182, 0.15))' }}
            />

            <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '300px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                Keamanan Akun Terjamin
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Tautan pemulihan akan dikirimkan secara aman ke kontak resmi email Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
