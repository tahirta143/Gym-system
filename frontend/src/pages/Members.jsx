import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Calendar, UserPlus, Users, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState('active');

  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canModify = ['super_admin', 'manager'].includes(currentUser.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, plansRes] = await Promise.all([
        api.get('members/'),
        api.get('plans/')
      ]);
      setMembers(membersRes.data);
      setPlans(plansRes.data);
      if (plansRes.data.length > 0) {
        setPlanId(plansRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setPhone('');
    setEmail('');
    setJoinDate(new Date().toISOString().split('T')[0]);
    if (plans.length > 0) {
      setPlanId(plans[0].id.toString());
    }
    setStatus('active');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setEditId(member.id);
    setName(member.name);
    setPhone(member.phone);
    setEmail(member.email);
    setJoinDate(member.join_date);
    setPlanId(member.plan.toString());
    setStatus(member.status);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const payload = {
      name,
      phone,
      email,
      join_date: joinDate,
      plan: parseInt(planId),
      status
    };

    try {
      if (editId) {
        await api.put(`members/${editId}/`, payload);
      } else {
        await api.post('members/', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to save member details. Check phone or input values.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member profile?')) {
      try {
        await api.delete(`members/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete member.');
      }
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === '' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      expired: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      frozen: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    };
    return (
      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  // Compute summary stats dynamically from members list
  const totalCount = members.length;
  const activeCount = members.filter(m => m.status === 'active').length;
  const expiredCount = members.filter(m => m.status === 'expired').length;
  const frozenCount = members.filter(m => m.status === 'frozen').length;

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Members Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage gym subscriptions, active profiles, and plan renewals.</p>
        </div>
        {canModify && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-3 bg-[#892D56] hover:bg-[#a13868] text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm self-start md:self-auto cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total Directory</span>
            <div className="p-2 bg-[#892D56]/20 rounded-xl text-[#892D56]">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{totalCount} Members</h3>
            <p className="text-xs text-[#892D56] font-medium mt-1">Total registered accounts</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Active Subscriptions</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{activeCount} Members</h3>
            <p className="text-xs text-emerald-400 font-medium mt-1">Currently training</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Expired Plans</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{expiredCount} Members</h3>
            <p className="text-xs text-rose-400 font-medium mt-1">Requires renewal follow-up</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Frozen Accounts</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{frozenCount} Members</h3>
            <p className="text-xs text-amber-400 font-medium mt-1">Temporary hold state</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 border border-white/5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 inset-y-0 my-auto text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-[#892D56] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-white/2">
                  <th className="py-4 px-6">Member Name</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Plan Name</th>
                  <th className="py-4 px-6">Expiry Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">No members found matching filters.</td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-200">
                        <div>
                          {member.name}
                          <span className="block text-xxs font-normal text-slate-500 lowercase mt-0.5">{member.email || 'no-email@gym.com'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">{member.phone}</td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {member.plan_details?.name || 'Loading Plan...'}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(member.status)}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {canModify ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 rounded-lg bg-[#892D56]/10 text-[#892D56] border border-[#892D56]/20 hover:bg-[#892D56] hover:text-white transition-all cursor-pointer"
                              title="Edit Member"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                              title="Delete Member"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-500 text-xs italic font-medium">View Only</span>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">
                {editId ? 'Edit Member Details' : 'Register New Member'}
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter member's full name"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Join Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Membership Plan</label>
                  <select
                    required
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (PKR {p.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              {editId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
              )}

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
                  className="px-5 py-2.5 bg-[#892D56] hover:bg-[#a13868] text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  {formLoading ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
