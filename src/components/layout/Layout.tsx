import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary font-sans selection:bg-accent/25 selection:text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,167,231,0.08)_0%,_transparent_50%)] pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
