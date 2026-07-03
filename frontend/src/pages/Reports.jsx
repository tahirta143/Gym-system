import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Printer } from 'lucide-react';
import api from '../utils/api';

const Reports = () => {
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('reports/');
      setFinancials(response.data.monthly_financials);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Cumulative Totals
  const cumulativeRevenue = financials.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
  const cumulativeExpenses = financials.reduce((sum, item) => sum + parseFloat(item.total_expenses), 0);
  const cumulativeNetProfit = financials.reduce((sum, item) => sum + parseFloat(item.net_profit), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 select-none print:p-0">
      
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            System Financial Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Month-by-month Income Statements (P&L Ledger) combining memberships collected and facility outflow.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-extrabold rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
        >
          <Printer size={18} />
          <span>Print Ledger</span>
        </button>
      </div>

      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block text-slate-900 border-b-2 border-slate-900 pb-6 mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-wide">Fitness Arena - GymPro OS</h1>
        <h2 className="text-xl font-semibold mt-1">Monthly General P&L Ledger Report</h2>
        <p className="text-xs text-slate-500 mt-2">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] print:hidden">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
            
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between print:border print:border-slate-300 print:bg-white print:text-slate-900">
              <div className="flex items-center justify-between print:hidden">
                <span className="text-sm font-semibold text-slate-400">Cumulative Revenue</span>
                <div className="p-2 bg-pink-500/10 rounded-xl text-[#ce5a8c]">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="mt-4 print:mt-0">
                <span className="hidden print:block text-xs uppercase font-bold text-slate-500">Cumulative Revenue</span>
                <h3 className="text-2xl font-bold text-slate-100 print:text-slate-900">
                  PKR {cumulativeRevenue.toLocaleString()}
                </h3>
                <p className="text-xs text-pink-400 print:text-slate-600 font-medium mt-1">Overall intake streams</p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between print:border print:border-slate-300 print:bg-white print:text-slate-900">
              <div className="flex items-center justify-between print:hidden">
                <span className="text-sm font-semibold text-slate-400">Cumulative Expenses</span>
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="mt-4 print:mt-0">
                <span className="hidden print:block text-xs uppercase font-bold text-slate-500">Cumulative Expenses</span>
                <h3 className="text-2xl font-bold text-slate-100 print:text-slate-900">
                  PKR {cumulativeExpenses.toLocaleString()}
                </h3>
                <p className="text-xs text-rose-400 print:text-slate-600 font-medium mt-1">Facility costs & payroll</p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between print:border print:border-slate-300 print:bg-white print:text-slate-900">
              <div className="flex items-center justify-between print:hidden">
                <span className="text-sm font-semibold text-slate-400">General Net Profit</span>
                <div className={`p-2 rounded-xl ${cumulativeNetProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="mt-4 print:mt-0">
                <span className="hidden print:block text-xs uppercase font-bold text-slate-500">General Net Profit</span>
                <h3 className={`text-2xl font-bold ${cumulativeNetProfit >= 0 ? 'text-slate-100 print:text-slate-900' : 'text-rose-400 print:text-rose-600'}`}>
                  PKR {cumulativeNetProfit.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-400 print:text-slate-600 font-medium mt-1">Balance margin</p>
              </div>
            </div>

          </div>

          {/* Ledger Table */}
          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden print:border-slate-300 print:bg-white print:shadow-none">
            <div className="p-6 border-b border-white/10 flex items-center justify-between print:px-0 print:py-4">
              <h3 className="font-bold text-lg text-slate-200 print:text-slate-950">Income Statements Ledger</h3>
              <FileSpreadsheet className="text-slate-400 print:hidden" size={20} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse print:text-slate-900">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-white/2 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                    <th className="py-4 px-6">Billing Period</th>
                    <th className="py-4 px-6 text-right">Fee Collections</th>
                    <th className="py-4 px-6 text-right">Late Charges</th>
                    <th className="py-4 px-6 text-right font-semibold text-pink-400 print:text-pink-600">Total Revenue</th>
                    <th className="py-4 px-6 text-right">Operating Spend</th>
                    <th className="py-4 px-6 text-right">Payroll Cost</th>
                    <th className="py-4 px-6 text-right font-semibold text-rose-400 print:text-rose-600">Total Expenses</th>
                    <th className="py-4 px-6 text-right font-extrabold text-emerald-400 print:text-slate-900">Net Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm print:divide-slate-300">
                  {financials.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-slate-500">No monthly financial histories logged yet.</td>
                    </tr>
                  ) : (
                    financials.map((item) => (
                      <tr key={item.month_key} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                        <td className="py-4 px-6 font-bold text-slate-200 print:text-slate-900">
                          {item.month_name}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-slate-300 print:text-slate-800">
                          PKR {parseFloat(item.revenue_collected).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-slate-300 print:text-slate-800">
                          PKR {parseFloat(item.late_fees_collected).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-pink-400 print:text-pink-600">
                          PKR {parseFloat(item.total_revenue).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-slate-300 print:text-slate-800">
                          -PKR {parseFloat(item.operating_expenses).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-slate-300 print:text-slate-800">
                          -PKR {parseFloat(item.payroll_payouts).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-rose-400 print:text-rose-600">
                          -PKR {parseFloat(item.total_expenses).toLocaleString()}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-extrabold text-base ${
                          parseFloat(item.net_profit) >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'
                        }`}>
                          {parseFloat(item.net_profit) >= 0 ? '+' : ''}PKR {parseFloat(item.net_profit).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable signature fields (Visible only when printing) */}
          <div className="hidden print:flex justify-between mt-24 text-slate-800">
            <div className="border-t border-slate-900 w-48 text-center pt-2">
              <p className="text-xs font-bold">Prepared By</p>
              <p className="text-xxs text-slate-500 mt-1">Gym Accountant</p>
            </div>
            <div className="border-t border-slate-900 w-48 text-center pt-2">
              <p className="text-xs font-bold">Authorized Approval</p>
              <p className="text-xxs text-slate-500 mt-1">Super Admin / Owner</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
