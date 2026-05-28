import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ArrowUpRight, ArrowDownLeft, ChevronDown, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const INCOME_CATEGORIES = ['Gaji', 'Investasi', 'Freelance', 'Hadiah', 'Lain-lain'];
const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Belanja', 'Lain-lain'];

// Helper untuk memformat angka dengan titik sebagai pemisah ribuan saat diketik
const formatThousands = (val) => {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseRawNumber = (formattedVal) => {
  if (!formattedVal) return 0;
  return parseFloat(formattedVal.replace(/\./g, '')) || 0;
};

export default function TransactionModal({ isOpen, onClose, addTransaction }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom Dropdown State & Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Custom Calendar State & Ref
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const calendarRef = useRef(null);

  // Set default tanggal hari ini saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setType('expense');
      setAmount('');
      setCategory('');
      setNote('');
      setError('');
      setIsDropdownOpen(false);
      setIsCalendarOpen(false);
      setViewDate(new Date());
    }
  }, [isOpen]);

  // Set default kategori saat tipe berubah
  useEffect(() => {
    setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }, [type]);

  // Kunci scroll halaman latar belakang ketika modal terbuka agar user lebih fokus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  // Tutup custom calendar ketika mengklik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper fungsi untuk Custom Calendar
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const formatFriendlyDate = (dateString) => {
    if (!dateString) return 'Pilih Tanggal';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Kosongkan slot hari sebelum hari pertama bulan berjalan
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    
    // Slot tombol hari
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = date === dayStr;
      
      const today = new Date();
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => {
            setDate(dayStr);
            setIsCalendarOpen(false);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all relative ${
            isSelected 
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25' 
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {day}
          {isToday && !isSelected && (
            <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
          )}
        </button>
      );
    }
    
    return days;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const rawAmount = parseRawNumber(amount);

    if (!rawAmount || rawAmount <= 0) {
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
      amount: rawAmount,
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
                <ArrowUpRight size={14} className={type === 'expense' ? 'stroke-[2.5]' : ''} />
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
                <ArrowDownLeft size={14} className={type === 'income' ? 'stroke-[2.5]' : ''} />
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
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(formatThousands(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 bg-slate-50/10"
              />
            </div>
          </div>

          {/* KATEGORI DROPDOWN (CUSTOM SELECT) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
            
            {/* Tombol Utama Dropdown */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-700 bg-white flex items-center justify-between active:scale-[0.99] select-none"
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
              <div className="absolute left-0 right-0 mt-1.5 z-30 bg-white border border-slate-100 shadow-xl rounded-xl py-1 text-xs select-none max-h-48 overflow-y-auto animate-fade-in">
                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => {
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

          {/* TANGGAL (CUSTOM CALENDAR) */}
          <div className="relative" ref={calendarRef}>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
            
            {/* Tombol Utama Trigger Calendar */}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-700 bg-white flex items-center justify-between active:scale-[0.99] select-none"
            >
              <span className="flex items-center gap-2">
                <Calendar size={15} className="text-slate-400" />
                {formatFriendlyDate(date)}
              </span>
              <ChevronDown 
                size={16} 
                className={`text-slate-400 transition-transform duration-200 ${
                  isCalendarOpen ? 'transform rotate-180 text-blue-500' : ''
                }`} 
              />
            </button>

            {/* Panel Kalender Pickers (Center Sub-Modal Style) */}
            {isCalendarOpen && (
              <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[1.5px] z-50 flex items-center justify-center p-4 select-none animate-fade-in">
                <div 
                  className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-5 w-72 relative animate-fade-in"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header Bulan & Tahun */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(viewDate);
                        prev.setMonth(prev.getMonth() - 1);
                        setViewDate(prev);
                      }}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(viewDate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(viewDate);
                        next.setMonth(next.getMonth() + 1);
                        setViewDate(next);
                      }}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Grid Nama Hari */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                      <div key={d} className="h-6 flex items-center justify-center">{d}</div>
                    ))}
                  </div>

                  {/* Grid Tanggal/Hari */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                  </div>

                  {/* Tombol Tutup Quick */}
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all border border-slate-100 text-center"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
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
