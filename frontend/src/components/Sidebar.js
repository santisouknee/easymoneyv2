'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '../utils/api';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  Bell, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleMobileSidebar }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [dashboardOpen, setDashboardOpen] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      submenu: [
        { title: 'Daily Collection', path: '/dashboard' },
        { title: 'Monthly KPI & Trends', path: '/dashboard/monthly' }
      ]
    },
    { title: 'Customers', icon: Users, path: '/customers' },
    { title: 'Contracts / Orders', icon: FileText, path: '/contracts' },
    { title: 'Payment Collection', icon: DollarSign, path: '/payments' },
    { title: 'Reminders', icon: Bell, path: '/reminders' },
    { title: 'Reports', icon: BarChart3, path: '/reports' }
  ];

  if (user?.role === 'admin') {
    menuItems.push({ title: 'User Accounts', icon: UserCheck, path: '/users' });
  }

  const handleMenuClick = (item) => {
    if (item.submenu) {
      setDashboardOpen(!dashboardOpen);
    }
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Top Brand Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
          ฿
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">Easy Money</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Down Payment Tracker</p>
        </div>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="p-4 mx-4 mt-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
            {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.fullName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {menuItems.map((item, idx) => {
          if (item.submenu) {
            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                  {dashboardOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                {dashboardOpen && (
                  <div className="pl-11 space-y-1">
                    {item.submenu.map((sub, sIdx) => {
                      const isActive = pathname === sub.path;
                      return (
                        <Link
                          key={sIdx}
                          href={sub.path}
                          onClick={toggleMobileSidebar}
                          className={`
                            block px-3 py-2 rounded-md text-xs transition-colors
                            ${isActive 
                              ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-500 pl-2.5' 
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                          `}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.path;
          return (
            <Link
              key={idx}
              href={item.path}
              onClick={toggleMobileSidebar}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
