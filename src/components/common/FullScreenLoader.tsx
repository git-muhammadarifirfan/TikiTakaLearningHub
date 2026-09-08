import React from 'react';

interface FullScreenLoaderProps {
  message?: string;
  subtext?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Memuat TikaTrack',
  subtext = 'Harap tunggu sebentar',
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        {/* Sleek 3 Bouncing Dots Loader */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ec4899',
              animation: 'simpleDotBounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.32s',
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#f472b6',
              animation: 'simpleDotBounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.16s',
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              animation: 'simpleDotBounce 1.4s infinite ease-in-out both',
            }}
          />
        </div>

        {/* Clean Typography */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem 0', letterSpacing: '-0.01em' }}>
            {message}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
            {subtext}
          </p>
        </div>
      </div>

      {/* Clean Keyframes for 3 Bouncing Dots */}
      <style>{`
        @keyframes simpleDotBounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};



