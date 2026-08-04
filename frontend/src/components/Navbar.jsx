import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'manager';

  // Theme state: dark is default, light is alternative
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const roleColors = {
    super_admin: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    manager: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    trainer: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    accountant: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  const roleLabels = {
    super_admin: 'Owner / Admin',
    manager: 'Front Desk / Manager',
    trainer: 'Trainer',
    accountant: 'Accountant',
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 px-8 flex items-center justify-between sticky top-0 backdrop-blur-md z-20">
      <div className="flex items-center gap-2 text-slate-400">
        <Calendar size={16} />
        <span className="text-xs font-semibold">{currentDate}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Light/Dark Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-[#892D56] hover:bg-white/10 transition-all cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Role Pill */}
        <span className={`text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full border ${roleColors[role] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
          {roleLabels[role] || role}
        </span>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'GP'}
          </div>
          <div className="hidden md:block">
            <h4 className="text-sm font-bold text-var(--text-primary) leading-tight">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
            </h4>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
