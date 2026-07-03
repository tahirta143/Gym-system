import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] text-slate-100 p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Icon Animation */}
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-bounce">
          <ShieldAlert size={44} />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
            Access Denied
          </h1>
          <p className="text-sm text-slate-400">
            You do not have the required permissions to view this system page.
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Error Code: 403 Forbidden
          </p>
        </div>

        {/* Actions */}
        <div className="w-full pt-4 border-t border-white/5 flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl border border-white/5 transition-all text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all text-sm cursor-pointer"
          >
            <Home size={16} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
