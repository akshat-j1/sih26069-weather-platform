import React from 'react';
import { Outlet } from 'react-router-dom';
import { StaffNavbar } from './StaffNavbar';
import { Footer } from './Footer';
import { StaffBottomNav } from './StaffBottomNav';

export const StaffLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased pb-16 md:pb-0">
      <StaffNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <StaffBottomNav />
    </div>
  );
};
