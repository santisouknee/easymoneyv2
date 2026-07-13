'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, Bell, Settings, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/api';

export default function Navbar({ onMenuClick }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Daily Collection Dashboard';
    
    switch (path) {
      case 'dashboard':
        return pathname.includes('monthly') ? 'Monthly KPI & Trends' : 'Daily Collection Dashboard';
      case 'customers':
        return 'Customer Directory';
      case 'contracts':
        return 'Contracts & Installment Schedules';
      case 'payments':
        return 'Record & View Payments';
      case 'reminders':
        return 'Due Date Alerts & Reminders';
      case 'reports':
        return 'Analytics & Export Reports';
      case 'users':
        return 'User Account Settings';
      default:
        return 'Easy Money';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-base font-bold text-slate-800 dark:text-white transition-colors">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Action icons */}
        <button className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block">
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">{user.fullName}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize">{user.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
