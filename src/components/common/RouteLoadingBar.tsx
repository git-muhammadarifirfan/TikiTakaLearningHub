import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const RouteLoadingBar: React.FC = () => {
  const location = useLocation();
  const [routeProgress, setRouteProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadingVisible, setLoadingVisible] = useState(false);

  // 1. Route Change Top Progress Bar
  useEffect(() => {
    setLoadingVisible(true);
    setRouteProgress(35);

    const timer1 = setTimeout(() => setRouteProgress(75), 100);
    const timer2 = setTimeout(() => {
      setRouteProgress(100);
      setTimeout(() => {
        setLoadingVisible(false);
        setRouteProgress(0);
      }, 200);
    }, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, location.search]);

  // 2. Real-time Smooth Scroll Progress Percentage
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const activeWidth = loadingVisible ? routeProgress : scrollProgress;

  return (
    <div className="route-loading-bar-container">
      <div
        className="route-loading-bar-fill"
        style={{
          width: `${activeWidth}%`,
          opacity: activeWidth > 0 ? 1 : 0,
          transition: loadingVisible ? 'width 0.25s ease-out' : 'width 0.1s ease-out, opacity 0.2s ease',
        }}
      />
    </div>
  );
};
export default RouteLoadingBar;
