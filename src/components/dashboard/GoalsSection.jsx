import React, { useState } from 'react';
import { Target, Plus, Trash2, X, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/format';

// Format angka dengan titik pemisah ribuan saat mengetik
const formatThousands = (val) => {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Konversi kembali ke angka murni sebelum dikirim ke API
const parseRawNumber = (val) => {
  if (!val) return 0;
  return parseFloat(val.replace(/\./g, '')) || 0;
};

export default function GoalsSection({ goals, addGoal, contributeGoal, removeGoal }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // State untuk kontribusi dana per target
  const [contribGoalId, setContribGoalId] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribSubmitting, setContribSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return setFormError('Nama target tabungan harus diisi');
    const rawTarget = parseRawNumber(targetAmount);
    if (!rawTarget || rawTarget <= 0) return setFormError('Target nominal harus lebih besar dari 0');
    if (!targetDate) return setFormError('Tanggal deadline harus diisi');

    setSubmitting(true);
    const res = await addGoal({
      name: name.trim(),
      target_amount: rawTarget,
      current_amount: parseRawNumber(currentAmount),
      target_date: targetDate
    });

    setSubmitting(false);
    if (res.success) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setShowAddForm(false);
    } else {
      setFormError(res.message || 'Gagal menambahkan target');
    }
  };

  const handleContribution = async (goalId) => {
    const rawContrib = parseRawNumber(contribAmount);
    if (!rawContrib || rawContrib <= 0) return;
    setContribSubmitting(true);
    const res = await contributeGoal(goalId, rawContrib);
    setContribSubmitting(false);
    if (res.success) {
      setContribAmount('');
      setContribGoalId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 group">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <Target size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Target Tabungan Impian</h3>
          </div>
          <p className="text-xs text-slate-500">Wujudkan resolusi finansial masa depan</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-300 ${
            showAddForm 
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/10'
          }`}
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? 'Batal' : 'Buat Target'}
        </button>
      </div>

      {/* FORM TAMBAH TARGET BARU */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100/80 space-y-3 animate-fade-in text-xs">
          <h4 className="font-bold text-slate-800">Buat Target Baru</h4>
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Target</label>
              <input
                type="text"
                placeholder="misal: DP Rumah Mandiri, Beli MacBook, Liburan"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs placeholder:text-slate-400 bg-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Dana (Rp)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="10.000.000"
                    value={targetAmount}
                    onChange={e => setTargetAmount(formatThousands(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tabungan Awal (Rp)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="500.000 (opsional)"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(formatThousands(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-white"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Tanggal Wujud</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs bg-white text-slate-700"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Target'}
          </button>
        </form>
      )}

      {/* DAFTAR TARGET TABUNGAN */}
      <div className="space-y-5">
        {goals.length > 0 ? (
          goals.map(goal => {
            const ratio = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const progress = Math.min(100, ratio);
            const isCompleted = ratio >= 100;

            return (
              <div 
                key={goal.id} 
                className={`p-4 border rounded-xl transition-all duration-300 hover:shadow-sm hover:border-slate-200/80 ${
                  isCompleted ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{goal.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCompleted 
                        ? 'text-emerald-600 bg-emerald-50' 
                        : 'text-blue-600 bg-blue-50'
                    }`}>
                      {ratio.toFixed(0)}% Tercapai
                    </span>
                  </div>
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-slate-400 font-medium">Target:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(goal.target_amount)}</span>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-all ml-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5 relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-3">
                  <span>Terkumpul: <strong className="text-slate-700 font-semibold">{formatRupiah(goal.current_amount)}</strong></span>
                  <span>Target Tanggal: <strong className="text-slate-700 font-semibold">{formatDate(goal.target_date)}</strong></span>
                </div>

                {/* ALOKASI DANA QUICK INTERACTIVE PANEL */}
                {!isCompleted && (
                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    {contribGoalId === goal.id ? (
                      <div className="flex items-center gap-1.5 w-full animate-fade-in">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="500.000"
                            value={contribAmount}
                            onChange={e => setContribAmount(formatThousands(e.target.value))}
                            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400"
                          />
                        </div>
                        <button
                          onClick={() => handleContribution(goal.id)}
                          disabled={contribSubmitting}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                        >
                          Kirim
                        </button>
                        <button
                          onClick={() => {
                            setContribGoalId(null);
                            setContribAmount('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setContribGoalId(goal.id)}
                        className="flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:text-blue-700 transition-all py-1 px-2 rounded-lg hover:bg-blue-50/50"
                      >
                        <ArrowUpRight size={13} className="stroke-[2.5]" />
                        Alokasikan Dana Tabungan
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 py-10 gap-2 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <Target size={28} className="stroke-[1.5]" />
            <p className="text-xs font-medium">Belum ada target tabungan diatur</p>
          </div>
        )}
      </div>
    </div>
  );
}
