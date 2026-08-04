import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, CreditCard, Building2, CheckCircle, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Form states mapping System Settings
  const [gymName, setGymName] = useState('Fitness Arena');
  const [currencySymbol, setCurrencySymbol] = useState('PKR');
  const [lateFeeAmount, setLateFeeAmount] = useState('50');
  const [jazzCashMerchant, setJazzCashMerchant] = useState('12345678');
  const [easyPaisaKey, setEasyPaisaKey] = useState('EP_SECRET_KEY');
  const [bankIban, setBankIban] = useState('PK00 UNIL 0000 0000 0000 0000');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canModify = ['super_admin'].includes(currentUser.role);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('settings/');
      setSettings(res.data);

      // Load inputs if records already exist
      res.data.forEach(item => {
        if (item.key === 'gym_name') setGymName(item.value);
        if (item.key === 'currency_symbol') setCurrencySymbol(item.value);
        if (item.key === 'late_fee_amount') setLateFeeAmount(item.value);
        if (item.key === 'jazzcash_merchant') setJazzCashMerchant(item.value);
        if (item.key === 'easypaisa_key') setEasyPaisaKey(item.value);
        if (item.key === 'bank_iban') setBankIban(item.value);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canModify) return;

    setSaving(true);
    setMessage('');

    const payload = [
      { key: 'gym_name', value: gymName, description: 'Gym business branding title' },
      { key: 'currency_symbol', value: currencySymbol, description: 'Currency representation' },
      { key: 'late_fee_amount', value: lateFeeAmount, description: 'Daily late charge amount' },
      { key: 'jazzcash_merchant', value: jazzCashMerchant, description: 'JazzCash gateway merchant key' },
      { key: 'easypaisa_key', value: easyPaisaKey, description: 'EasyPaisa gateway API credential' },
      { key: 'bank_iban', value: bankIban, description: 'Bank transfer account details' }
    ];

    try {
      // Loop to save each setting
      await Promise.all(payload.map(setting => {
        const existing = settings.find(s => s.key === setting.key);
        if (existing) {
          return api.put(`settings/${existing.id}/`, setting);
        } else {
          return api.post('settings/', setting);
        }
      }));

      setMessage('System configurations updated successfully!');
      fetchSettings();
    } catch (err) {
      console.error(err);
      alert('Failed to save settings. Check role permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-sm text-slate-500">Loading system settings...</div>;
  }

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure company details, branding options, late fee rates, and gateway accounts.</p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle size={20} className="shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex gap-4 border-b border-[var(--border-primary)] pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'general'
              ? 'bg-[#892D56] text-white'
              : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
            }`}
        >
          <Building2 size={16} />
          <span>General Config</span>
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'gateways'
              ? 'bg-[#892D56] text-white'
              : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
            }`}
        >
          <CreditCard size={16} />
          <span>Payment Gateways</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="max-w-2xl glass-panel p-8 rounded-3xl border border-white/5 space-y-6">

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gym Business Name</label>
              <input
                type="text"
                required
                disabled={!canModify}
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Currency Representation</label>
                <input
                  type="text"
                  required
                  disabled={!canModify}
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Daily Late Dues Fee (PKR)</label>
                <input
                  type="number"
                  required
                  disabled={!canModify}
                  value={lateFeeAmount}
                  onChange={(e) => setLateFeeAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gateways' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">JazzCash Merchant ID</label>
              <input
                type="text"
                required
                disabled={!canModify}
                value={jazzCashMerchant}
                onChange={(e) => setJazzCashMerchant(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">EasyPaisa API Access Key</label>
              <input
                type="password"
                required
                disabled={!canModify}
                value={easyPaisaKey}
                onChange={(e) => setEasyPaisaKey(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank IBAN Transfer Account</label>
              <input
                type="text"
                required
                disabled={!canModify}
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>
          </div>
        )}

        {canModify && (
          <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 bg-[#892D56] hover:bg-[#a13868] text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50"
            >
              <Save size={18} />
              <span>{saving ? 'Saving System Settings...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}

        {!canModify && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>View-only mode: Only Super Admins can update system configurations.</span>
          </div>
        )}

      </form>
    </div>
  );
};

export default Settings;
