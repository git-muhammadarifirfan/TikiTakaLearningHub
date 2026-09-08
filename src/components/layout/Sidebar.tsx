import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  FileText,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Data Murid', path: '/students', icon: Users },
    ...(isAdmin ? [{ label: 'Guru & Admin', path: '/teachers', icon: UserCheck }] : []),
    { label: 'Mata Pelajaran', path: '/subjects', icon: BookOpen },
    { label: 'Jadwal Les', path: '/schedule', icon: Calendar },
    { label: 'Presensi Harian', path: '/attendance', icon: Clock },
    { label: 'Kelas Pengganti', path: '/makeup-classes', icon: ClipboardList },
    { label: 'Laporan Belajar', path: '/reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #ec4899, #f472b6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              boxShadow: '0 6px 16px rgba(236, 72, 153, 0.35)',
              flexShrink: 0,
            }}
          >
            T
          </div>
          <div className="sidebar-brand">
            <h1>{APP_NAME}</h1>
            {APP_TAGLINE && <p>{APP_TAGLINE}</p>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

      {/* Promo Card Motivasi Bahasa Inggris dengan Ilustrasi Rocket SVG & Tombol Sign Out */}
      <div className="sidebar-promo-card">
        {/* Floating Top Rocket & Planet SVG Illustration */}
        <div
          style={{
            position: 'absolute',
            top: '-55px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '95px',
            pointerEvents: 'none',
          }}
        >
          <svg width="100" height="95" viewBox="0 0 100 95" fill="none">
            {/* Background Blob Pink Soft */}
            <path
              d="M20 40C15 25 30 10 50 10C70 10 85 20 80 40C75 60 60 75 40 70C20 65 25 55 20 40Z"
              fill="#fce7f3"
            />
            {/* Planet Pink with Ring */}
            <circle cx="35" cy="22" r="10" fill="#f472b6" />
            <ellipse cx="35" cy="22" rx="14" ry="4" fill="none" stroke="#fbcfe8" strokeWidth="2" transform="rotate(-20 35 22)" />

            {/* Character Pink Hoodie Guy */}
            <path d="M28 50 C25 65 20 75 35 75 C45 75 45 65 42 50 Z" fill="#ec4899" />
            <circle cx="35" cy="46" r="6" fill="#fbcfe8" />

            {/* Launching Rocket */}
            <g transform="translate(48, 12) rotate(35)">
              {/* Rocket Body */}
              <path d="M 12 0 C 18 10 18 25 12 35 C 6 25 6 10 12 0 Z" fill="#1e293b" />
              <path d="M 12 0 C 15 8 15 15 12 20 Z" fill="#f59e0b" />
              {/* Window */}
              <circle cx="12" cy="14" r="3.5" fill="#38bdf8" />
              {/* Fins */}
              <path d="M 5 22 L 0 30 L 7 28 Z" fill="#ec4899" />
              <path d="M 19 22 L 24 30 L 17 28 Z" fill="#ec4899" />
              {/* Fire Flame */}
              <path d="M 8 35 Q 12 45 16 35 Z" fill="#ef4444" />
              <path d="M 10 35 Q 12 41 14 35 Z" fill="#fbbf24" />
            </g>

            {/* Little Stars & Dots */}
            <circle cx="75" cy="48" r="3" fill="#f472b6" />
            <circle cx="20" cy="30" r="2" fill="#fbbf24" />
            <circle cx="82" cy="25" r="1.5" fill="#818cf8" />
          </svg>
        </div>

        <h4>Aura centil dan imoet!</h4>
        <p>Irfan ganteng tampan gagah dan pemberani sekali bung !</p>

        <button
          onClick={logout}
          className="btn"
          style={{
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderRadius: '9999px',
            padding: '0.55rem 1.25rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            width: '100%',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} color="#ef4444" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  </>
  );
};
export default Sidebar;
