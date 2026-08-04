import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('login/', { username, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0c0c0c] font-sans selection:bg-[#892D56] selection:text-white">

      {/* --- Left Column: Hero Gym View (Hidden on mobile) --- */}
      <div
        className="hidden lg:flex lg:w-[72%] h-screen relative bg-cover bg-center items-end p-16 select-none"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200')` }}
      >
        {/* Dark overlay to match image */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

        {/* Content bottom-left */}
        <div className="relative z-10 space-y-4 max-w-lg">
          {/* Fitness Arena Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#892D56] text-white rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-lg">
            <Dumbbell className="h-4.5 w-4.5" />
            <span>Fitness Arena</span>
          </div>

          {/* Typography */}
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
              TRAIN HARD.
            </h1>
            <h1 className="text-5xl font-black tracking-tight text-[#892D56] leading-tight">
              STAY STRONG.
            </h1>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            Your all-in-one platform for members, subscriptions, payments, and attendance tracking.
          </p>
        </div>
      </div>

      {/* --- Right Column: Solid Payout/Login Panel --- */}
      <div className="w-full lg:w-[28%] h-screen flex flex-col justify-between bg-[#121214] text-slate-100 p-8 md:p-12 relative z-10 border-l border-white/5 shadow-2xl">

        {/* Top spacer */}
        <div></div>

        {/* Form Container */}
        <div className="space-y-6">
          <div>
            <p className="text-slate-500 text-xxs font-extrabold uppercase tracking-widest font-mono">
              Fitness Gym OS
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-white mt-1 leading-none uppercase">
              Welcome<br />Back
            </h2>
            <p className="text-slate-400 text-xs mt-2 font-medium">
              Sign in to manage your gym operations.
            </p>
            {/* Color Accent Divider */}
            <div className="w-8 h-1.5 bg-[#892D56] mt-4 rounded-full"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                Email Address / Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#1c1c1f] border border-white/5 rounded-lg text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-[#892D56] focus:ring-1 focus:ring-[#892D56] transition-all font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#1c1c1f] border border-white/5 rounded-lg text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-[#892D56] focus:ring-1 focus:ring-[#892D56] transition-all font-semibold font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#892D56] hover:bg-[#a13868] text-white font-black rounded-lg shadow-md transition-all text-xs tracking-widest uppercase select-none cursor-pointer"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Footer info matching image */}
        <div className="text-center pt-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-white/5 flex-1"></div>
            <span className="text-slate-600 text-xxs tracking-wider font-semibold font-mono">
              &copy; 2026 Fitness Arena
            </span>
            <div className="h-px bg-white/5 flex-1"></div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Login;
