import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const INCOME_CATEGORIES = ['Gaji', 'Investasi', 'Freelance', 'Hadiah', 'Lain-lain'];
const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Belanja', 'Lain-lain'];

export default function TransactionModal({ isOpen, onClose, addTransaction }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set default tanggal hari ini saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setType('expense');
      setAmount('');
      setCategory('');
      setNote('');
      setError('');
    }
  }, [isOpen]);

  // Set default kategori saat tipe berubah
  useEffect(() => {
    setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      return setError('Nominal transaksi wajib diisi dan harus lebih besar dari 0');
    }
    if (!category) {
      return setError('Kategori transaksi wajib dipilih');
    }
    if (!date) {
      return setError('Tanggal transaksi wajib dipilih');
    }

    setSubmitting(true);
    const res = await addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      date,
      note: note.trim() || null
    });
    setSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Gagal menyimpan transaksi, periksa masukan Anda.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div 
        className="bg-white w-full max-w-md border border-slate-100 shadow-2xl rounded-2xl p-6 relative overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-5">
          <h3 className="text-base font-bold text-slate-950">Catat Transaksi Baru</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-600">
          
          {/* TOGGLE TIPE TRANSAKSI */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipe Transaksi</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 border border-slate-200/50 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-sm border border-rose-100'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <ArrowDownLeft size={14} className={type === 'expense' ? 'stroke-[2.5]' : ''} />
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <ArrowUpRight size={14} className={type === 'income' ? 'stroke-[2.5]' : ''} />
                Pemasukan
              </button>
            </div>
          </div>

          {/* NOMINAL/JUMLAH UANG */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 bg-slate-50/10"
              />
            </div>
          </div>

          {/* KATEGORI DROPDOWN */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-semibold text-slate-700 bg-white"
            >
              {type === 'income' 
                ? INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
              }
            </select>
          </div>

          {/* TANGGAL */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-semibold text-slate-700 bg-white"
            />
          </div>

          {/* CATATAN */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Catatan Tambahan (Opsional)</label>
            <textarea
              rows="3"
              maxLength="500"
              placeholder="misal: Beli makan malam bareng keluarga..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50/10 resize-none font-normal"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 transition-all disabled:opacity-50 mt-2 text-sm`}
          >
            {submitting ? 'Menyimpan...' : 'Catat Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
}
