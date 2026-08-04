import React, { useEffect, useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  CalendarCheck, AlertCircle, Award, CheckCircle, BarChart3 
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement, Title, 
  Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../utils/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, 
  PointElement, LineElement, Title, Tooltip, Legend
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('analytics/');
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-[#892D56] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 max-w-md mx-auto mt-10">
        {error}
      </div>
    );
  }

  if (!data) return null;

  // Chart configuration for Owner/Accountant (Financials)
  const financialChartData = data.role === 'financial' ? {
    labels: data.chart_data.map(d => d.month),
    datasets: [
      {
        label: 'Revenue (PKR)',
        data: data.chart_data.map(d => d.revenue),
        backgroundColor: 'rgba(137, 45, 86, 0.85)',
        borderColor: 'rgb(137, 45, 86)',
        borderRadius: 8,
      },
      {
        label: 'Expenses (PKR)',
        data: data.chart_data.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: 'rgb(239, 68, 68)',
        borderRadius: 8,
      }
    ]
  } : null;

  // Chart configuration for Manager (Member Registration growth)
  const managerChartData = data.role === 'manager' ? {
    labels: data.chart_data.map(d => d.month),
    datasets: [
      {
        label: 'New Registrations',
        data: data.chart_data.map(d => d.count),
        backgroundColor: 'rgba(137, 45, 86, 0.85)',
        borderColor: 'rgb(137, 45, 86)',
        borderRadius: 8,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', weight: 'bold' } }
      },
      tooltip: {
        padding: 12,
        titleFont: { family: 'Inter', size: 14, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 13 },
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">Hello, {user.first_name || user.username}. Here is the summary of what is happening today.</p>
      </div>

      {/* ---------------- 1. OWNER / ACCOUNTANT VIEW ---------------- */}
      {data.role === 'financial' && (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Total Revenue</span>
                <div className="p-2 bg-[#892D56]/20 rounded-xl text-[#892D56]">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">PKR {data.summary.total_revenue.toLocaleString()}</h3>
                <p className="text-xs text-[#892D56] font-medium mt-1">Overall collections</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Total Expenses</span>
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">PKR {data.summary.total_expenses.toLocaleString()}</h3>
                <p className="text-xs text-rose-400 font-medium mt-1">All categories</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Net Profit</span>
                <div className={`p-2 rounded-xl ${data.summary.net_profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-2xl font-bold ${data.summary.net_profit >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
                  PKR {data.summary.net_profit.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Net take-home margin</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Pending Dues</span>
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">PKR {data.summary.pending_dues.toLocaleString()}</h3>
                <p className="text-xs text-amber-400 font-medium mt-1">Current period pending</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between border-rose-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Overdue Dues</span>
                <div className="p-2 bg-rose-500/25 rounded-xl text-rose-400">
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-rose-400">PKR {data.summary.overdue_dues.toLocaleString()}</h3>
                <p className="text-xs text-rose-400 font-semibold mt-1">{data.summary.overdue_count} members late</p>
              </div>
            </div>
          </div>

          {/* Chart & Rankings Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-3xl lg:col-span-2 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-200">Revenue vs Expenses Trends</h3>
                <BarChart3 className="text-slate-400 h-5 w-5" />
              </div>
              <div className="h-80 relative">
                <Bar data={financialChartData} options={chartOptions} />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Award className="text-[#892D56] h-5 w-5 animate-spin" />
                <h3 className="font-bold text-lg text-slate-200">Top Performing Trainers</h3>
              </div>
              <div className="space-y-4">
                {data.trainer_rankings.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-10">No trainer records found.</p>
                ) : (
                  data.trainer_rankings.map((trainer, index) => (
                    <div key={trainer.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#892D56]/20 text-[#892D56] font-bold flex items-center justify-center text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{trainer.name}</h4>
                          <p className="text-xs text-slate-400 truncate max-w-[120px]">{trainer.specialization}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#892D56] font-bold">{trainer.active_clients} PT Clients</p>
                        <p className="text-xxs text-slate-400 font-semibold mt-0.5">Comm: PKR {trainer.commission_total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------- 2. MANAGER VIEW ---------------- */}
      {data.role === 'manager' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Total Members</span>
                <div className="p-2 bg-[#892D56]/20 rounded-xl text-[#892D56]">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">{data.summary.total_members}</h3>
                <p className="text-xs text-[#892D56] font-medium mt-1">{data.summary.active_members} active subscriptions</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Today's Check-ins</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <CalendarCheck size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">{data.summary.today_checkins}</h3>
                <p className="text-xs text-emerald-400 font-medium mt-1">Logs recorded today</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Paid Monthly Dues</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <CheckCircle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">{data.summary.dues_collected}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Paid out of {data.summary.total_dues}</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Pending Dues</span>
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-amber-400">{data.summary.dues_pending}</h3>
                <p className="text-xs text-amber-400 font-semibold mt-1">Awaiting payments</p>
              </div>
            </div>
          </div>

          {/* Chart Row */}
          <div className="grid grid-cols-1 gap-8">
            <div className="glass-panel p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-200">Registration Growth Trend (Last 6 Months)</h3>
                <BarChart3 className="text-slate-400 h-5 w-5" />
              </div>
              <div className="h-80 relative">
                <Bar data={managerChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------- 3. TRAINER VIEW ---------------- */}
      {data.role === 'trainer' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Active Clients</span>
                <div className="p-2 bg-[#892D56]/20 rounded-xl text-[#892D56]">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">{data.summary.active_clients}</h3>
                <p className="text-xs text-[#892D56] font-medium mt-1">Assigned PT members</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Total Sessions Logs</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <CalendarCheck size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">{data.summary.sessions_used} / {data.summary.sessions_total}</h3>
                <p className="text-xs text-emerald-400 font-medium mt-1">{data.summary.sessions_remaining} sessions remaining</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Monthly Commission</span>
                <div className="p-2 bg-[#892D56]/20 rounded-xl text-[#892D56]">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">PKR {data.summary.commission_earned.toLocaleString()}</h3>
                <p className="text-xs text-[#892D56] font-medium mt-1">Earned from PT fees this month</p>
              </div>
            </div>

            <div className="glass-card stats-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">Estimated Net Pay</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-100">PKR {data.summary.net_pay.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Base + Commission</p>
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <h3 className="font-bold text-lg text-slate-200 mb-6">Assigned PT Roster & Progress</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-4">Client Name</th>
                    <th className="py-4 px-4">Contact</th>
                    <th className="py-4 px-4">Sessions Progress</th>
                    <th className="py-4 px-4">Sessions Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {data.clients.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 px-4 text-center text-slate-500">No active clients assigned.</td>
                    </tr>
                  ) : (
                    data.clients.map((client, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-200">{client.member_name}</td>
                        <td className="py-4 px-4 text-slate-400 font-mono">{client.member_phone}</td>
                        <td className="py-4 px-4 w-1/3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#892D56] rounded-full" 
                                style={{ width: `${(client.sessions_used / client.sessions_total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-[#892D56]">
                              {Math.round((client.sessions_used / client.sessions_total) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {client.sessions_used} completed / {client.sessions_remaining} remaining
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
