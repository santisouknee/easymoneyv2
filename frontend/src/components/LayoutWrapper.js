'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/api';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getAuthToken();
    if (!token && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-200">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar 
        isOpen={mobileSidebarOpen} 
        toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        <Navbar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Overlay background for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}
