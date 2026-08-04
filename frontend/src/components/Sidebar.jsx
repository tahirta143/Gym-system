import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Dumbbell, CalendarCheck,
  CreditCard, DollarSign, Receipt, LogOut, ChevronLeft, ChevronRight, FileSpreadsheet, Shield,
  Apple, Activity, Settings, UploadCloud, Coins
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'manager';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Define nav links based on roles
  const allLinks = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['super_admin', 'manager', 'trainer', 'accountant']
    },
    {
      name: 'Members',
      path: '/members',
      icon: Users,
      roles: ['super_admin', 'manager', 'trainer', 'accountant']
    },
    {
      name: 'Membership Plans',
      path: '/plans',
      icon: Dumbbell,
      roles: ['super_admin', 'manager']
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      roles: ['super_admin', 'manager', 'trainer', 'accountant']
    },
    {
      name: 'Fee Collection',
      path: '/fees',
      icon: CreditCard,
      roles: ['super_admin', 'manager', 'accountant']
    },
    {
      name: 'Trainers',
      path: '/trainers',
      icon: Dumbbell,
      roles: ['super_admin', 'manager']
    },
    {
      name: 'PT Packages',
      path: '/pt-packages',
      icon: Dumbbell,
      roles: ['super_admin', 'manager', 'trainer']
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: Receipt,
      roles: ['super_admin', 'accountant']
    },
    {
      name: 'Payroll Engine',
      path: '/payroll',
      icon: DollarSign,
      roles: ['super_admin', 'accountant', 'trainer']
    },
    {
      name: 'Financial Reports',
      path: '/reports',
      icon: FileSpreadsheet,
      roles: ['super_admin', 'accountant']
    },
    {
      name: 'Access Control',
      path: '/access-control',
      icon: Shield,
      roles: ['super_admin']
    },
    {
      name: 'Workout Plans',
      path: '/workouts',
      icon: Activity,
      roles: ['super_admin', 'manager', 'trainer']
    },
    {
      name: 'Diet Plans',
      path: '/diets',
      icon: Apple,
      roles: ['super_admin', 'manager', 'trainer']
    },
    {
      name: 'Payments Ledger',
      path: '/payments',
      icon: Coins,
      roles: ['super_admin', 'manager', 'accountant']
    },
    {
      name: 'CSV Bulk Import',
      path: '/import-data',
      icon: UploadCloud,
      roles: ['super_admin', 'manager']
    },
    {
      name: 'System Settings',
      path: '/settings',
      icon: Settings,
      roles: ['super_admin', 'manager']
    }
  ];

  const visibleLinks = allLinks.filter(link => link.roles.includes(role));

  return (
    <aside className={`glass-panel h-full flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${isCollapsed ? 'w-20' : 'w-64'} text-slate-800 dark:text-slate-100`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 h-16">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-indigo-500 animate-pulse" />
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                GYMPRO
              </span>
            </div>
          )}
          {isCollapsed && (
            <Dumbbell className="h-8 w-8 text-indigo-500 mx-auto animate-pulse" />
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="mt-4 px-3 space-y-1 pb-4">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl sidebar-link text-sm font-medium ${isActive
                    ? 'bg-[#892D56] text-white active'
                    : 'text-slate-400'
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />
                {!isCollapsed && <span>{link.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout / User Info */}
      <div className="p-3 border-t border-slate-200 dark:border-white/10">
        {!isCollapsed && (
          <div className="px-3 py-2 mb-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold font-mono">Logged in as</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.first_name || user.username}</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold capitalize mt-0.5">{role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-all font-semibold text-sm cursor-pointer"
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
