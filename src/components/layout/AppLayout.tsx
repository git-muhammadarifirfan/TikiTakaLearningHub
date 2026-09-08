import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};
export default AppLayout;
