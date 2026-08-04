import React, { useEffect, useState } from 'react';
import { RefreshCw, DollarSign, Download, Edit2, CheckCircle2, FileText } from 'lucide-react';
import api from '../utils/api';

const Payroll = () => {
  const [payrollList, setPayrollList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Salary calculation state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7) + '-01');
  const [calculating, setCalculating] = useState(false);
  const [calcMessage, setCalcMessage] = useState('');

  // Deductions modal
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);
  const [activePayroll, setActivePayroll] = useState(null);
  const [deductions, setDeductions] = useState('0');
  const [formLoading, setFormLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAccountantOrAdmin = ['super_admin', 'accountant'].includes(currentUser.role);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await api.get('payroll/');
      setPayrollList(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async () => {
    setCalcMessage('');
    setCalculating(true);
    try {
      await api.post('payroll/calculate/', { month: selectedMonth });
      setCalcMessage('Payroll successfully calculated for all trainers!');
      fetchPayroll();
    } catch (err) {
      console.error(err);
      alert('Failed to calculate payroll.');
    } finally {
      setCalculating(false);
    }
  };

  const handleOpenDeductions = (payroll) => {
    setActivePayroll(payroll);
    setDeductions(payroll.deductions.toString());
    setShowDeductionsModal(true);
  };

  const handleSaveDeductions = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Calculate new net pay: base_pay + commission_earned - deductions
      const basePay = parseFloat(activePayroll.base_pay);
      const commissionEarned = parseFloat(activePayroll.commission_earned);
      const newDeductions = parseFloat(deductions);
      const netPay = basePay + commissionEarned - newDeductions;

      const payload = {
        trainer: activePayroll.trainer,
        month: activePayroll.month,
        base_pay: basePay,
        commission_earned: commissionEarned,
        deductions: newDeductions,
        net_pay: netPay
      };

      await api.put(`payroll/${activePayroll.id}/`, payload);
      setShowDeductionsModal(false);
      fetchPayroll();
    } catch (err) {
      console.error(err);
      alert('Failed to update deductions.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDownloadPayslip = async (payrollId) => {
    try {
      const res = await api.get(`payroll/${payrollId}/payslip/`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `payslip_${payrollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Payslip download failed:', err);
      alert('Failed to download payslip. Please try again.');
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Payroll Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage trainer monthly payouts, commissions based on active PT packages, and print payslips.</p>
        </div>

        {isAccountantOrAdmin && (
          <div className="flex items-center gap-3 bg-[#0d1424]/60 border border-white/10 p-2.5 rounded-2xl shrink-0">
            <input
              type="date"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-[#070b13] border border-white/10 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none"
            />
            <button
              onClick={handleCalculatePayroll}
              disabled={calculating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              <RefreshCw size={14} className={calculating ? 'animate-spin' : ''} />
              <span>{calculating ? 'Running...' : 'Run Payroll'}</span>
            </button>
          </div>
        )}
      </div>

      {calcMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="font-semibold">{calcMessage}</span>
        </div>
      )}

      {/* Payroll List */}
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
                  <th className="py-4 px-6">Trainer Name</th>
                  <th className="py-4 px-6">Month</th>
                  <th className="py-4 px-6">Base Salary</th>
                  <th className="py-4 px-6">Commissions</th>
                  <th className="py-4 px-6">Deductions</th>
                  <th className="py-4 px-6 font-bold text-emerald-400">Net Pay</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {payrollList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-500">No payroll summaries found.</td>
                  </tr>
                ) : (
                  payrollList.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {payroll.trainer_details?.name || 'Loading trainer...'}
                        <span className="block text-xxs font-normal text-slate-500 capitalize">{payroll.trainer_details?.salary_type} Structure</span>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">{payroll.month_name}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono">PKR {parseFloat(payroll.base_pay).toLocaleString()}</td>
                      <td className="py-4 px-6 text-[#892D56] font-semibold font-mono">
                        PKR {parseFloat(payroll.commission_earned).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-rose-400 font-mono">
                        -PKR {parseFloat(payroll.deductions).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-400 font-mono text-base">
                        PKR {parseFloat(payroll.net_pay).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {isAccountantOrAdmin && (
                          <button
                            onClick={() => handleOpenDeductions(payroll)}
                            className="p-1.5 rounded-lg bg-[#892D56]/10 text-[#892D56] border border-[#892D56]/20 hover:bg-[#892D56] hover:text-white transition-all cursor-pointer"
                            title="Adjust Deductions"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPayslip(payroll.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                          title="Download PDF Payslip"
                        >
                          <Download size={16} />
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

      {/* Adjust Deductions Modal */}
      {showDeductionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">Adjust Payout Deductions</h3>
              <button 
                onClick={() => setShowDeductionsModal(false)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeductions} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Trainer Name</p>
                <p className="text-base font-bold text-indigo-400 mt-1">{activePayroll?.trainer_details?.name}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deductions (PKR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="Enter deductions e.g. 1500"
                  className="w-full px-4 py-2.5 bg-[#0d1424]/60 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                />
                <p className="text-xxs text-slate-500 mt-1">E.g., penalties for unpaid leaves or equipment damage.</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeductionsModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-[#892D56] hover:bg-[#a13868] text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  {formLoading ? 'Saving...' : 'Update Deductions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
