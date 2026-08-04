import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Shield, Phone, Mail } from 'lucide-react';
import api from '../utils/api';

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [salaryType, setSalaryType] = useState('fixed');
  const [baseSalary, setBaseSalary] = useState('0');
  const [commissionPct, setCommissionPct] = useState('0');
  
  // Login credentials (for creating user accounts)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.role === 'super_admin';

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const response = await api.get('trainers/');
      setTrainers(response.data);
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
    setSpecialization('');
    setSalaryType('fixed');
    setBaseSalary('0');
    setCommissionPct('0');
    setUsername('');
    setPassword('');
    setEmail('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (trainer) => {
    setEditId(trainer.id);
    setName(trainer.name);
    setPhone(trainer.phone);
    setSpecialization(trainer.specialization);
    setSalaryType(trainer.salary_type);
    setBaseSalary(trainer.base_salary.toString());
    setCommissionPct(trainer.commission_pct.toString());
    setUsername('');
    setPassword('');
    setEmail('');
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
      specialization,
      salary_type: salaryType,
      base_salary: parseFloat(baseSalary),
      commission_pct: parseFloat(commissionPct)
    };

    // If adding, we can send username/password/email
    if (!editId) {
      payload.username = username;
      payload.password = password;
      payload.email = email;
    }

    try {
      if (editId) {
        await api.put(`trainers/${editId}/`, payload);
      } else {
        await api.post('trainers/', payload);
      }
      setShowModal(false);
      fetchTrainers();
    } catch (err) {
      console.error(err);
      setError('Failed to save trainer details. Ensure username/email is unique if creating an account.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trainer?')) {
      try {
        await api.delete(`trainers/${id}/`);
        fetchTrainers();
      } catch (err) {
        console.error(err);
        alert('Failed to delete trainer.');
      }
    }
  };

  const salaryTypeLabels = {
    fixed: 'Fixed Only',
    commission: 'Commission Only',
    hybrid: 'Hybrid (Base + Comm)'
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Trainers Database
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage trainer profiles, specialty specializations, and core payroll settings.</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-3 bg-[#892D56] hover:bg-[#a13868] text-white font-bold rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Trainer</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-[#892D56] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainers.length === 0 ? (
            <p className="col-span-full text-slate-500 text-center py-10 font-semibold">No trainer profiles created yet.</p>
          ) : (
            trainers.map((trainer) => (
              <div 
                key={trainer.id} 
                className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-xl group hover:border-[#892D56]/40 transition-all duration-300"
              >
                <div>
                  {/* Header info */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-200 group-hover:text-[#892D56] transition-colors">
                        {trainer.name}
                      </h3>
                      <p className="text-xs text-indigo-400 font-semibold mt-0.5">{trainer.specialization}</p>
                    </div>
                    {trainer.user && (
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Linked System Account">
                        <Shield size={16} />
                      </span>
                    )}
                  </div>

                  {/* Body contact info */}
                  <div className="my-6 space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-500" />
                      <span>{trainer.phone}</span>
                    </div>
                    {trainer.user_details?.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-500" />
                        <span className="truncate max-w-[200px]">{trainer.user_details.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Details (Only visible to Admin) */}
                  {isSuperAdmin && (
                    <div className="mt-6 p-4 rounded-2xl bg-white/2 border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Salary Type:</span>
                        <span className="text-slate-200 font-bold capitalize">{salaryTypeLabels[trainer.salary_type]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Base Salary:</span>
                        <span className="text-slate-200 font-bold font-mono">PKR {parseFloat(trainer.base_salary).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Commission Rate:</span>
                        <span className="text-slate-200 font-bold font-mono">{parseFloat(trainer.commission_pct)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isSuperAdmin && (
                  <div className="pt-6 mt-8 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(trainer)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(trainer.id)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-500/10"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">
                {editId ? 'Edit Trainer Settings' : 'Add New Trainer Profile'}
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

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80svh] overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1">Trainer Bio</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Trainer Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ali Ahmed"
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001112222"
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specialization</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Strength Training, Cardio, Nutrition"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1 pt-2">Salary Structure</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Salary Type</label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  >
                    <option value="fixed">Fixed Only</option>
                    <option value="commission">Comm Only</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Pay (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={salaryType === 'commission'}
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Comm %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={salaryType === 'fixed'}
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Login accounts generation - only for Add Mode */}
              {!editId && (
                <>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1 pt-2">Create System User Login</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="trainer1"
                        className="w-full px-3 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@gym.com"
                        className="w-full px-3 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </>
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
                  {formLoading ? 'Saving...' : 'Save Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;
