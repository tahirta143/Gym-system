import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, CalendarCheck, CheckCircle, Search, Eye, Filter, FileText } from 'lucide-react';
import api from '../utils/api';

const Payments = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Payment Settlement Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeFee, setActiveFee] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('fees/');
      setFees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (fee) => {
    setActiveFee(fee);
    setPayMethod('cash');
    setShowModal(true);
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!activeFee) return;

    setSubmitting(true);
    try {
      await api.patch(`fees/${activeFee.id}/`, {
        status: 'paid',
        method: payMethod,
        payment_date: new Date().toISOString().split('T')[0]
      });
      setShowModal(false);
      fetchFees();
    } catch (err) {
      console.error(err);
      alert('Failed to update invoice payment status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = async (feeId) => {
    try {
      // Use axios so the Authorization: Token header is sent automatically
      const res = await api.get(`fees/${feeId}/receipt/`, {
        responseType: 'blob',
      });

      // Create a temporary object URL and trigger download
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `fee_receipt_${feeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Receipt download failed:', err);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  // Filter Logic
  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.member_details?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fee.member_details?.phone.includes(searchTerm);
    const matchesStatus = statusFilter === '' || fee.status === statusFilter;
    const matchesMethod = methodFilter === '' || fee.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculations for Stat Cards
  const totalCollected = fees.reduce((sum, f) => f.status === 'paid' ? sum + parseFloat(f.amount) : sum, 0);
  const pendingDues = fees.reduce((sum, f) => f.status === 'pending' ? sum + parseFloat(f.amount) : sum, 0);
  const overdueDues = fees.reduce((sum, f) => f.status === 'overdue' ? sum + parseFloat(f.amount) : sum, 0);

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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Billing & Payments Book
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track memberships fees, print receipts, and reconcile pending or overdue invoices.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total Collected</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {totalCollected.toLocaleString()}</h3>
            <p className="text-xs text-emerald-400 font-medium mt-1">Paid invoices + late charges</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Pending Dues</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {pendingDues.toLocaleString()}</h3>
            <p className="text-xs text-amber-400 font-medium mt-1">Awaiting active payment</p>
          </div>
        </div>

        <div className="glass-card stats-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Overdue Balances</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">PKR {overdueDues.toLocaleString()}</h3>
            <p className="text-xs text-rose-400 font-medium mt-1">Past target due dates</p>
          </div>
        </div>

      </div>

      {/* Filter and Search controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 border border-white/5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 inset-y-0 my-auto text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search invoice by member name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
          />
        </div>
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none font-medium"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="w-full md:w-44">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none font-medium"
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Ledger Table Row */}
      {loading ? (
        <div className="text-center py-20 text-sm text-slate-500">Loading ledger logs...</div>
      ) : filteredFees.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center text-slate-400">
          No billing records match filters.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-primary)] text-slate-400 text-xs font-semibold uppercase tracking-wider bg-transparent">
                  <th className="py-4 px-6">Member Name</th>
                  <th className="py-4 px-6">Period</th>
                  <th className="py-4 px-6">Due Date</th>
                  <th className="py-4 px-6">Payment Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)] text-slate-300 text-sm">
                {filteredFees.map(fee => (
                  <tr key={fee.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-200">{fee.member_details?.name}</td>
                    <td className="py-4 px-6">{fee.month_name}</td>
                    <td className="py-4 px-6">{fee.due_date || 'N/A'}</td>
                    <td className="py-4 px-6">{fee.payment_date || '-'}</td>
                    <td className="py-4 px-6 font-semibold">PKR {parseFloat(fee.amount).toLocaleString()}</td>
                    <td className="py-4 px-6">{getStatusBadge(fee.status)}</td>
                    <td className="py-4 px-6 capitalize">{fee.method}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {fee.status !== 'paid' ? (
                        <button
                          onClick={() => handleOpenPay(fee)}
                          className="px-3.5 py-1.5 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-black rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Settle Pay
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePrintReceipt(fee.id)}
                          className="px-3.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:opacity-80 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Receipt PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      {showModal && activeFee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Settle Invoice Payment</h3>
            <p className="text-xs text-slate-400 mb-6">
              Reconcile membership dues for <strong>{activeFee.member_details?.name}</strong> for {activeFee.month_name}.
            </p>

            <form onSubmit={handleSettlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
                >
                  <option value="cash">Cash payment</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="jazzcash">JazzCash transfer</option>
                  <option value="easypaisa">Easypaisa transfer</option>
                  <option value="bank">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs">
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                  <span className="font-bold text-slate-300">Total Payable:</span>
                  <span className="font-black text-[#ce5a8c]">PKR {parseFloat(activeFee.amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-[var(--bg-card)] hover:opacity-85 border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-black rounded-xl text-sm shadow-md cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Settle Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payments;
