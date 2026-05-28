import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Plus, Trash2, X, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Belanja', 'Lain-lain'];


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

export default function BudgetsSection({ budgets, transactions, addBudget, removeBudget }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup custom dropdown ketika mengklik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleAddForm = () => {
    if (!showAddForm) {
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setFormError('');
    }
    setShowAddForm(!showAddForm);
  };


  // Hitung total pengeluaran per kategori untuk bulan berjalan
  const getCategorySpending = (catName) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === catName.toLowerCase())
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!category.trim()) return setFormError('Kategori harus diisi');
    const rawAmount = parseRawNumber(amount);
    if (!rawAmount || rawAmount <= 0) return setFormError('Batas anggaran harus lebih besar dari 0');

    setSubmitting(true);
    const res = await addBudget({
      category: category.trim(),
      amount: rawAmount,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    setSubmitting(false);
    if (res.success) {
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setShowAddForm(false);
    } else {
      setFormError(res.message || 'Gagal menambahkan anggaran');
    }
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 group">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <PieChart size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Batas Anggaran Bulanan</h3>
          </div>
          <p className="text-xs text-slate-500">Kendalikan pengeluaran agar tetap hemat</p>
        </div>
        <button
          onClick={handleToggleAddForm}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-300 ${
            showAddForm 
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/10'
          }`}
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? 'Batal' : 'Atur Anggaran'}
        </button>
      </div>

      {/* FORM TAMBAH ANGGARAN (INLINE ACCORDION) */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100/80 space-y-3 animate-fade-in text-xs relative z-50">
          <h4 className="font-bold text-slate-800">Atur Anggaran Baru</h4>
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative z-40" ref={dropdownRef}>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Pengeluaran</label>
              
              {/* Tombol Utama Dropdown */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-700 bg-white flex items-center justify-between active:scale-[0.99] select-none"
              >
                <span>{category || 'Pilih Kategori'}</span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'transform rotate-180 text-blue-500' : ''
                  }`} 
                />
              </button>

              {/* List Pilihan Dropdown */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-100 shadow-xl rounded-xl py-1 text-xs select-none max-h-48 overflow-y-auto animate-fade-in">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className={`px-3.5 py-2 font-medium cursor-pointer transition-all duration-150 flex items-center justify-between ${
                          isSelected 
                            ? 'bg-blue-50/70 text-blue-600 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check size={14} className="text-blue-600 stroke-[2.5]" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Batas Nominal (Rp)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1.500.000"
                  value={amount}
                  onChange={e => setAmount(formatThousands(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Anggaran'}
          </button>
        </form>
      )}

      {/* DAFTAR BUDGET PROGRESS METER */}
      <div className="space-y-5">
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const spent = getCategorySpending(budget.category);
            const ratio = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const progress = Math.min(100, ratio);
            
            // Tentukan warna progress bar & alarm
            let progressColor = 'bg-blue-500';
            let textColor = 'text-blue-600 bg-blue-50';
            let borderStatus = 'border-slate-100';

            if (ratio >= 100) {
              progressColor = 'bg-rose-500';
              textColor = 'text-rose-600 bg-rose-50';
              borderStatus = 'border-rose-100 bg-rose-50/10';
            } else if (ratio >= 75) {
              progressColor = 'bg-amber-500';
              textColor = 'text-amber-600 bg-amber-50';
              borderStatus = 'border-amber-100 bg-amber-50/10';
            }

            return (
              <div 
                key={budget.id} 
                className={`p-4 border rounded-xl transition-all duration-300 hover:shadow-sm hover:border-slate-200/80 ${borderStatus}`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{budget.category}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${textColor}`}>
                      {ratio.toFixed(0)}% Terpakai
                    </span>
                  </div>
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-slate-400 font-medium">Batas:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(budget.amount)}</span>
                    <button
                      onClick={() => removeBudget(budget.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-all ml-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar meter */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5 relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Terpakai: <strong className="text-slate-700 font-semibold">{formatRupiah(spent)}</strong></span>
                  <span>Sisa: <strong className={ratio >= 100 ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}>
                    {ratio >= 100 ? 'Habis (Overspend)' : formatRupiah(budget.amount - spent)}
                  </strong></span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 py-10 gap-2 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <PieChart size={28} className="stroke-[1.5]" />
            <p className="text-xs font-medium">Belum ada anggaran diatur bulan ini</p>
          </div>
        )}
      </div>
    </div>
  );
}
