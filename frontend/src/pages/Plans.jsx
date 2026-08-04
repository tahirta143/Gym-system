import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, DollarSign } from 'lucide-react';
import api from '../utils/api';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [price, setPrice] = useState('');
  const [featuresText, setFeaturesText] = useState('');

  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('plans/');
      setPlans(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setDurationMonths('1');
    setPrice('');
    setFeaturesText('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditId(plan.id);
    setName(plan.name);
    setDurationMonths(plan.duration_months.toString());
    setPrice(plan.price.toString());
    setFeaturesText(plan.features.join('\n'));
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f !== '');

    const payload = {
      name,
      duration_months: parseInt(durationMonths),
      price: parseFloat(price),
      features
    };

    try {
      if (editId) {
        await api.put(`plans/${editId}/`, payload);
      } else {
        await api.post('plans/', payload);
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
      setError('Failed to save membership plan.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan? This will fail if there are members subscribed to it.')) {
      try {
        await api.delete(`plans/${id}/`);
        fetchPlans();
      } catch (err) {
        console.error(err);
        alert('Failed to delete plan. Check if it is currently linked to active members.');
      }
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Membership Plans
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure subscription pricing tiers, durations, and bundle features.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-[#892D56] hover:bg-[#a13868] text-white font-bold rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Add Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-[#892D56] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.length === 0 ? (
            <p className="col-span-full text-slate-500 text-center py-10 font-semibold">No membership plans created yet.</p>
          ) : (
            plans.map((plan) => (
              <div 
                key={plan.id} 
                className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-[#892D56]/40 transition-all duration-300"
              >
                <div>
                  {/* Plan Badge / Title */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-extrabold text-xl text-slate-200 group-hover:text-[#892D56] transition-colors">
                      {plan.name}
                    </h3>
                    <span className="text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#892D56]/20 text-[#892D56] border border-[#892D56]/30">
                      {plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="my-6 flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-100">PKR {parseFloat(plan.price).toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-medium ml-1">/ plan fee</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Features</h4>
                    {plan.features.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No features defined.</p>
                    ) : (
                      plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 mt-8 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="py-2 px-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-500/10"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">
                {editId ? 'Edit Plan Details' : 'Create New Membership Plan'}
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plan Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Monthly, Annual VIP"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (Months)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Plan Fee"
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Plan Features (one per line)
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Gym Floor Access&#10;Group Classes&#10;Sauna Access"
                  rows="4"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-sans"
                ></textarea>
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
                  className="px-5 py-2.5 bg-[#892D56] hover:bg-[#a13868] text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  {formLoading ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
