import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Receipt, TrendingDown, Home, Dumbbell, Users } from 'lucide-react';
import api from '../utils/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [category, setCategory] = useState('utilities');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get('expenses/');
      setExpenses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setCategory('utilities');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (expense) => {
    setEditId(expense.id);
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setDescription(expense.description);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const payload = {
      category,
      amount: parseFloat(amount),
      date,
      description
    };

    try {
      if (editId) {
        await api.put(`expenses/${editId}/`, payload);
      } else {
        await api.post('expenses/', payload);
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setError('Failed to save expense details. Check values.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense entry?')) {
      try {
        await api.delete(`expenses/${id}/`);
        fetchExpenses();
      } catch (err) {
        console.error(err);
        alert('Failed to delete expense.');
      }
    }
  };

  const categoryLabels = {
    rent: 'Rent',
    utilities: 'Utilities',
    equipment: 'Equipment',
    salary: 'Salary Payments',
    commission: 'Trainer Commissions',
    misc: 'Miscellaneous'
  };

  const categoryColors = {
    rent: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    utilities: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    equipment: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    salary: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    commission: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    misc: 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  };

  // Compute summary stats dynamically from expenses list
  const totalOutflow = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const rentAndUtils = expenses.reduce((sum, exp) => ['rent', 'utilities'].includes(exp.category) ? sum + parseFloat(exp.amount) : 0, 0);
  const equipmentTotal = expenses.reduce((sum, exp) => exp.category === 'equipment' ? sum + parseFloat(exp.amount) : sum, 0);
  const payrollTotal = expenses.reduce((sum, exp) => ['salary', 'commission'].includes(exp.category) ? sum + parseFloat(exp.amount) : sum, 0);

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Expense Tracking
          </h1>
          <p className="text-slate-400 text-sm mt-1">Record facility operations costs, utilities, salary payments, and machinery maintenance.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-extrabold rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total Outflow</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {totalOutflow.toLocaleString()}</h3>
            <p className="text-xs text-rose-400 font-medium mt-1">Total operational spend</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Rent & Utilities</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Home size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {rentAndUtils.toLocaleString()}</h3>
            <p className="text-xs text-amber-400 font-medium mt-1">Rent and bills total</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Gym Equipment</span>
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
              <Dumbbell size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {equipmentTotal.toLocaleString()}</h3>
            <p className="text-xs text-cyan-400 font-medium mt-1">Machinery & asset costs</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Payroll & Commissions</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {payrollTotal.toLocaleString()}</h3>
            <p className="text-xs text-purple-400 font-medium mt-1">Staff salary payouts</p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
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
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">No expenses logged yet.</td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoryColors[exp.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/25'}`}>
                          {categoryLabels[exp.category] || exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        <div>
                          {exp.description || 'No description provided.'}
                          <span className="block text-xxs font-normal text-slate-500 mt-0.5">Added by: {exp.added_by_details?.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 font-bold text-rose-400">
                        PKR {parseFloat(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
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
                {editId ? 'Edit Expense Record' : 'Record Operating Expense'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  >
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="equipment">Equipment</option>
                    <option value="salary">Salary</option>
                    <option value="commission">Commission</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="PKR Dues"
                    className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expense Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this payment..."
                  rows="3"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none font-sans"
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
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  {formLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
