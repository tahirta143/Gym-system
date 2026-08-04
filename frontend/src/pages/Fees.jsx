import React, { useEffect, useState } from 'react';
import { CreditCard, Search, Plus, Printer, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectId, setCollectId] = useState(null);
  const [collectName, setCollectName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [formLoading, setFormLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAccountantOrAdmin = ['super_admin', 'accountant'].includes(currentUser.role);
  const canCollect = ['super_admin', 'manager', 'accountant'].includes(currentUser.role);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const response = await api.get('fees/');
      setFees(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollect = (fee) => {
    setCollectId(fee.id);
    setCollectName(fee.member_details?.name || 'Member');
    setPaymentMethod('cash');
    setShowCollectModal(true);
  };

  const handleSaveCollection = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post(`fees/${collectId}/collect/`, { method: paymentMethod });
      setShowCollectModal(false);
      fetchFees();
    } catch (err) {
      console.error(err);
      alert('Failed to save collection.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    setMessage('');
    setGenerating(true);
    try {
      const response = await api.post('fees/auto-generate/');
      setMessage(`Success: ${response.data.created_count} monthly bills generated.`);
      fetchFees();
    } catch (err) {
      console.error(err);
      alert('Failed to generate dues.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintReceipt = (feeId) => {
    // Open print window directly to let browser download file
    const token = localStorage.getItem('token');
    const url = `http://127.0.0.1:8000/api/fees/${feeId}/receipt/?token=${token}`;

    // Create link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `receipt_${feeId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists
  const filteredFees = fees.filter(fee => {
    const memberName = fee.member_details?.name || '';
    const phone = fee.member_details?.phone || '';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    const matchesStatus = statusFilter === '' || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      overdue: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Fee Collection
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track memberships fees, print receipts, and manage pending or overdue invoices.</p>
        </div>
        {isAccountantOrAdmin && (
          <button
            onClick={handleAutoGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-3 bg-[#892D56] hover:bg-[#a13868] text-white font-extrabold rounded-2xl shadow-lg disabled:opacity-50 transition-all text-sm self-start md:self-auto cursor-pointer"
          >
            <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
            <span>{generating ? 'Generating...' : 'Auto-Generate Monthly Dues'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle size={20} className="shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 border border-white/5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 inset-y-0 my-auto text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by member name or phone..."
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
            <option value="">All Invoices</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Fees Table */}
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
                  <th className="py-4 px-6">Period</th>
                  <th className="py-4 px-6">Dues Amount</th>
                  <th className="py-4 px-6">Late Fees</th>
                  <th className="py-4 px-6">Overdue Days</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-500">No invoices recorded.</td>
                  </tr>
                ) : (
                  filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-200">
                        <div>
                          {fee.member_details?.name || 'Unknown'}
                          <span className="block text-xxs font-normal text-slate-500 font-mono mt-0.5">{fee.member_details?.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">{fee.month_name}</td>
                      <td className="py-4 px-6 font-bold text-slate-200">PKR {parseFloat(fee.amount).toLocaleString()}</td>
                      <td className="py-4 px-6 text-rose-400 font-semibold">
                        {parseFloat(fee.late_fee) > 0 ? `PKR ${parseFloat(fee.late_fee).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {fee.overdue_days > 0 ? (
                          <span className="text-rose-400 font-bold font-mono">{fee.overdue_days} Days</span>
                        ) : (
                          <span className="text-slate-500 text-xs">On time / Pending</span>
                        )}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(fee.status)}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {fee.status !== 'paid' && canCollect && (
                          <button
                            onClick={() => handleOpenCollect(fee)}
                            className="px-3.5 py-1.5 bg-[#892D56] hover:bg-[#a13868] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                          >
                            Collect Fee
                          </button>
                        )}
                        {fee.status === 'paid' && (
                          <button
                            onClick={() => handlePrintReceipt(fee.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                            title="Print PDF Receipt"
                          >
                            <Printer size={16} />
                          </button>
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

      {/* Collect Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">Confirm Payment Collection</h3>
              <button
                onClick={() => setShowCollectModal(false)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-400">Recording fee payment details for:</p>
                <p className="text-base font-bold text-indigo-400 mt-1">{collectName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  {formLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
