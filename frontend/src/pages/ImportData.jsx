import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ImportData = () => {
  const [file, setFile] = useState(null);
  const [targetType, setTargetType] = useState('members');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_type', targetType);

    try {
      const res = await api.post('import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
      setFile(null);
      // Reset input element
      document.getElementById('csvFileInput').value = '';
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        if (err.response.data.details) {
          setResult({ success: false, errors: err.response.data.details });
        }
      } else {
        setError('Failed to import CSV file. Make sure file format and headers match specifications.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Bulk Data Import
        </h1>
        <p className="text-slate-400 text-sm mt-1">Upload records in bulk using CSV templates for members and trainers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpload} className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">

            {/* Target Select */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Import Target Entity</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="members"
                    checked={targetType === 'members'}
                    onChange={() => { setTargetType('members'); setResult(null); }}
                    className="accent-[#892D56]"
                  />
                  <span>Gym Members</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="trainers"
                    checked={targetType === 'trainers'}
                    onChange={() => { setTargetType('trainers'); setResult(null); }}
                    className="accent-[#892D56]"
                  />
                  <span>Personal Trainers</span>
                </label>
              </div>
            </div>

            {/* Drag & Drop Upload field */}
            <div className="border-2 border-dashed border-[var(--border-primary)] rounded-2xl p-8 text-center bg-[var(--bg-card)] hover:border-[#892D56]/50 transition-colors flex flex-col items-center justify-center space-y-3">
              <Upload size={32} className="text-slate-400" />
              <div className="text-sm font-semibold text-slate-200">
                {file ? file.name : 'Select or drop your CSV file here'}
              </div>
              <p className="text-xxs text-slate-500">Only standard comma-separated values (.csv) format is supported.</p>
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('csvFileInput').click()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border-primary)] font-bold rounded-xl text-xs cursor-pointer"
              >
                Browse File
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3.5 bg-[#892D56] hover:bg-[#a13868] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Processing File...' : 'Begin Batch Import'}
            </button>
          </form>

          {/* Results Summary Dashboard */}
          {result && (
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                {result.success !== false ? (
                  <>
                    <CheckCircle className="text-emerald-400" size={20} />
                    <span className="text-emerald-400">Import Complete</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-amber-400" size={20} />
                    <span className="text-amber-400">Import Error Logs</span>
                  </>
                )}
              </h3>

              {result.imported_count !== undefined && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm font-bold text-emerald-400">Successfully created {result.imported_count} records!</p>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400">Row Failure Details ({result.errors.length}):</p>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-xxs text-rose-400 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Help Guide Card */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
              <FileText size={18} className="text-[#892D56]" />
              <span>CSV File Templates</span>
            </h3>

            {targetType === 'members' ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <p>Ensure your CSV headers match exactly (case-sensitive, comma delimited):</p>
                <div className="p-3 bg-black/30 rounded-xl font-mono text-[10px] text-[#892D56] select-all overflow-x-auto whitespace-nowrap">
                  name,phone,email,join_date,plan,status
                </div>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li><strong>name</strong>: Member's full name (required).</li>
                  <li><strong>phone</strong>: Numeric string (required, unique).</li>
                  <li><strong>join_date</strong>: Format <code className="font-mono">YYYY-MM-DD</code>.</li>
                  <li><strong>plan</strong>: Partial name of existing plans (e.g. "Monthly").</li>
                  <li><strong>status</strong>: <code className="font-mono">active</code>, <code className="font-mono">expired</code>, or <code className="font-mono">frozen</code>.</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <p>Ensure your CSV headers match exactly (case-sensitive, comma delimited):</p>
                <div className="p-3 bg-black/30 rounded-xl font-mono text-[10px] text-[#892D56] select-all overflow-x-auto whitespace-nowrap">
                  name,phone,specialization,salary_type,base_salary,commission_pct
                </div>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li><strong>name</strong>: Trainer's full name (required).</li>
                  <li><strong>phone</strong>: Contact digits (required).</li>
                  <li><strong>salary_type</strong>: <code className="font-mono">fixed</code>, <code className="font-mono">commission</code>, or <code className="font-mono">hybrid</code>.</li>
                  <li><strong>base_salary</strong>: Numeric value.</li>
                  <li><strong>commission_pct</strong>: Commission percentage digits (0-100).</li>
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportData;
