import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Dumbbell, UserCheck, PlusSquare } from 'lucide-react';
import api from '../utils/api';

const PTPackages = () => {
  const [packages, setPackages] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [sessionsTotal, setSessionsTotal] = useState('12');
  const [sessionsUsed, setSessionsUsed] = useState('0');
  const [price, setPrice] = useState('');

  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isTrainer = currentUser.role === 'trainer';
  const canModify = ['super_admin', 'manager'].includes(currentUser.role);

  useEffect(() => {
    fetchPackages();
    if (canModify) {
      fetchSupportData();
    }
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await api.get('pt-packages/');
      setPackages(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [membersRes, trainersRes] = await Promise.all([
        api.get('members/'),
        api.get('trainers/')
      ]);
      setMembers(membersRes.data.filter(m => m.status === 'active'));
      setTrainers(trainersRes.data);
      if (membersRes.data.length > 0) setMemberId(membersRes.data[0].id.toString());
      if (trainersRes.data.length > 0) setTrainerId(trainersRes.data[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    if (members.length > 0) setMemberId(members[0].id.toString());
    if (trainers.length > 0) setTrainerId(trainers[0].id.toString());
    setSessionsTotal('12');
    setSessionsUsed('0');
    setPrice('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditId(pkg.id);
    setMemberId(pkg.member.toString());
    setTrainerId(pkg.trainer.toString());
    setSessionsTotal(pkg.sessions_total.toString());
    setSessionsUsed(pkg.sessions_used.toString());
    setPrice(pkg.price.toString());
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const payload = {
      member: parseInt(memberId),
      trainer: parseInt(trainerId),
      sessions_total: parseInt(sessionsTotal),
      sessions_used: parseInt(sessionsUsed),
      price: parseFloat(price)
    };

    try {
      if (editId) {
        await api.put(`pt-packages/${editId}/`, payload);
      } else {
        await api.post('pt-packages/', payload);
      }
      setShowModal(false);
      fetchPackages();
    } catch (err) {
      console.error(err);
      setError('Failed to save PT package. Verify inputs.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this PT package contract?')) {
      try {
        await api.delete(`pt-packages/${id}/`);
        fetchPackages();
      } catch (err) {
        console.error(err);
        alert('Failed to delete package.');
      }
    }
  };

  // Increment completed sessions counter
  const handleIncrementSession = async (pkg) => {
    if (pkg.sessions_used >= pkg.sessions_total) {
      alert('All sessions for this package have already been completed!');
      return;
    }
    
    try {
      const payload = {
        ...pkg,
        sessions_used: pkg.sessions_used + 1
      };
      await api.put(`pt-packages/${pkg.id}/`, payload);
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert('Failed to record session log.');
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Personal Training Packages
          </h1>
          <p className="text-slate-400 text-sm mt-1">Assign trainers to members, log sessions, and track PT revenues.</p>
        </div>
        {canModify && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Assign PT Package</span>
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-white/2">
                  <th className="py-4 px-6">Member Name</th>
                  <th className="py-4 px-6">Assigned Trainer</th>
                  <th className="py-4 px-6">Sessions Progress</th>
                  <th className="py-4 px-6">Contract Price</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">No active PT packages recorded.</td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {pkg.member_details?.name || 'Loading member...'}
                      </td>
                      <td className="py-4 px-6 text-indigo-400 font-bold">
                        {pkg.trainer_details?.name || 'Loading trainer...'}
                      </td>
                      <td className="py-4 px-6 w-1/3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${(pkg.sessions_used / pkg.sessions_total) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-indigo-400 shrink-0">
                            {pkg.sessions_used} / {pkg.sessions_total}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-200">
                        PKR {parseFloat(pkg.price).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {pkg.sessions_used < pkg.sessions_total && (
                          <button
                            onClick={() => handleIncrementSession(pkg)}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Log Session Completion"
                          >
                            <UserCheck size={14} />
                            <span>+1 Session</span>
                          </button>
                        )}
                        {canModify && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">
                {editId ? 'Edit PT Package Settings' : 'Assign New PT Package'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Member</label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  disabled={editId !== null}
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Trainer</label>
                <select
                  required
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                >
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Sessions</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sessionsTotal}
                    onChange={(e) => setSessionsTotal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sessions Completed</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={sessionsTotal}
                    value={sessionsUsed}
                    onChange={(e) => setSessionsUsed(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Package Price (PKR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Total price of package contract"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  {formLoading ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PTPackages;
