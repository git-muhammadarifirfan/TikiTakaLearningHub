import React, { useEffect, useState } from 'react';

interface CuteLoaderProps {
  message?: string;
  subMessage?: string;
}

export const CuteLoader: React.FC<CuteLoaderProps> = ({
  message = 'Memuat Data...',
  subMessage = 'Mohon tunggu sebentar ya ~ ✨',
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      style={{
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fff 50%, #fef3c7 100%)',
        border: '2px dashed var(--pink-light)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Parallax Background Floating Elements */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(244, 114, 182, 0.15)',
          transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)`,
          transition: 'transform 0.1s ease-out',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '12%',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.18)',
          transform: `translate(${mousePos.x * -1.2}px, ${mousePos.y * -1.2}px)`,
          transition: 'transform 0.1s ease-out',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '75%',
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          background: 'rgba(192, 132, 252, 0.15)',
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          transition: 'transform 0.1s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Cute Interactive SVG Mascot with Bouncing Animation & Parallax Eye Movement */}
      <div
        style={{
          transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`,
          transition: 'transform 0.15s ease-out',
          marginBottom: '1.25rem',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            animation: 'cuteBounce 2s infinite ease-in-out',
            filter: 'drop-shadow(0 8px 16px rgba(244, 114, 182, 0.25))',
          }}
        >
          <style>
            {`
              @keyframes cuteBounce {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-12px) scale(1.03); }
              }
              @keyframes starRotate {
                0% { transform: rotate(0deg) scale(0.9); }
                50% { transform: rotate(180deg) scale(1.1); }
                100% { transform: rotate(360deg) scale(0.9); }
              }
              @keyframes ringPulse {
                0%, 100% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.08); opacity: 0.9; }
              }
            `}
          </style>

          {/* Outer Pulsing Aura Ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="#fde047"
            fillOpacity="0.2"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeDasharray="6 6"
            style={{ transformOrigin: 'center', animation: 'ringPulse 3s infinite ease-in-out' }}
          />

          {/* Cute Book Body */}
          <rect x="25" y="30" width="70" height="60" rx="14" fill="#f472b6" />
          <path d="M 25 42 H 95 V 82 C 95 87 90 90 85 90 H 35 C 30 90 25 87 25 82 Z" fill="#ec4899" />

          {/* Book Pages Top Cut */}
          <path d="M 30 30 C 45 22, 55 22, 60 30 C 65 22, 75 22, 90 30 L 90 34 C 75 26, 65 26, 60 34 C 55 26, 45 26, 30 34 Z" fill="#ffffff" />
          
          {/* Eyes follow cursor subtly */}
          <circle cx={47 + mousePos.x * 0.1} cy={55 + mousePos.y * 0.1} r="5" fill="#1e293b" />
          <circle cx={73 + mousePos.x * 0.1} cy={55 + mousePos.y * 0.1} r="5" fill="#1e293b" />
          
          {/* Eye Highlights */}
          <circle cx={49 + mousePos.x * 0.1} cy={53 + mousePos.y * 0.1} r="2" fill="#ffffff" />
          <circle cx={75 + mousePos.x * 0.1} cy={53 + mousePos.y * 0.1} r="2" fill="#ffffff" />

          {/* Cute Rosy Cheeks */}
          <ellipse cx="40" cy="63" rx="5.5" ry="3.5" fill="#fda4af" />
          <ellipse cx="80" cy="63" rx="5.5" ry="3.5" fill="#fda4af" />

          {/* Cute Smile */}
          <path d="M 54 62 Q 60 68 66 62" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Decorative Magic Star */}
          <path
            d="M 98 22 L 100 28 L 106 30 L 100 32 L 98 38 L 96 32 L 90 30 L 96 28 Z"
            fill="#fbbf24"
            style={{ transformOrigin: '98px 30px', animation: 'starRotate 4s infinite linear' }}
          />
        </svg>
      </div>

      {/* Text Info */}
      <h3
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.35rem',
          textAlign: 'center',
        }}
      >
        {message}
      </h3>
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          margin: 0,
        }}
      >
        {subMessage}
      </p>

      {/* Progress Dots Loader */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.25rem' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: i === 0 ? '#f472b6' : i === 1 ? '#fbbf24' : '#c084fc',
              animation: `cuteDotPulse 1.2s infinite ease-in-out ${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes cuteDotPulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1.2); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};
export default CuteLoader;
