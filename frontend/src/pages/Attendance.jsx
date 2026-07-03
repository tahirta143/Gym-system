import React, { useEffect, useState } from 'react';
import { Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api from '../utils/api';

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick Check-in search
  const [memberSearch, setMemberSearch] = useState('');
  const [checkinMessage, setCheckinMessage] = useState('');
  const [checkinError, setCheckinError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canCheckIn = ['super_admin', 'manager'].includes(currentUser.role);

  useEffect(() => {
    fetchLogs();
    if (canCheckIn) {
      fetchMembers();
    }
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('attendance/');
      setLogs(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('members/');
      // Filter only active members for check-in dropdown/searches
      setMembers(response.data.filter(m => m.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (memberId, name) => {
    setCheckinError('');
    setCheckinMessage('');
    try {
      await api.post('attendance/check-in/', { member_id: memberId });
      setCheckinMessage(`Check-in logged successfully for ${name}!`);
      setMemberSearch('');
      fetchLogs();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setCheckinError(err.response.data.error);
      } else {
        setCheckinError('Check-in failed. Please verify status or try again.');
      }
    }
  };

  // Filter logs for general table search
  const filteredLogs = logs.filter(log => {
    const name = log.member_details?.name || '';
    const phone = log.member_details?.phone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
  });

  // Filter members for quick check-in selection
  const matchingMembersForCheckin = memberSearch.trim() === '' ? [] : 
    members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch)).slice(0, 5);

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Attendance Log
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track check-in times and record daily member presence.</p>
      </div>

      {/* Quick Check-in (Manager/Admin Only) */}
      {canCheckIn && (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
            <Clock className="text-indigo-400 h-5 w-5 animate-pulse" />
            <span>Quick Member Check-In</span>
          </h3>
          
          <div className="max-w-xl relative">
            <Search className="absolute left-3 inset-y-0 my-auto text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search active member by name or phone to check in..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Check-in results */}
          {matchingMembersForCheckin.length > 0 && (
            <div className="max-w-xl bg-[#0f172a] border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden z-40 relative">
              {matchingMembersForCheckin.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 hover:bg-white/2 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{m.name}</p>
                    <p className="text-xxs text-slate-400 font-mono">{m.phone} | {m.plan_details?.name}</p>
                  </div>
                  <button
                    onClick={() => handleCheckIn(m.id, m.name)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {checkinMessage && (
            <div className="max-w-xl p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="font-semibold">{checkinMessage}</span>
            </div>
          )}
          {checkinError && (
            <div className="max-w-xl p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-semibold">{checkinError}</span>
            </div>
          )}
        </div>
      )}

      {/* Filters & Log History */}
      <div className="space-y-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-white/5">
          <Search className="text-slate-400 h-5 w-5 shrink-0" />
          <input
            type="text"
            placeholder="Search check-in logs by member name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-white/2">
                    <th className="py-4 px-6">Member Name</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6">Check-In Date</th>
                    <th className="py-4 px-6">Check-In Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 px-6 text-center text-slate-500">No attendance entries recorded.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-200">
                          {log.member_details?.name || 'Unknown Member'}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-400">
                          {log.member_details?.phone || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-medium">
                          {new Date(log.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
