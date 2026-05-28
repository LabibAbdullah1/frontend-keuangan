import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  X, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sparkles, 
  Info,
  Clock
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/format';

const INCOME_CATEGORIES = ['Gaji', 'Investasi', 'Freelance', 'Hadiah', 'Lain-lain'];
const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Belanja', 'Lain-lain'];

const FREQUENCIES = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' }
];

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

export default function RecurringSection({ 
  recurringTemplates, 
  addRecurringTemplate, 
  toggleRecurringActive, 
  removeRecurringTemplate, 
  triggerProcessRecurring 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [note, setNote] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown & Calendar State & Refs
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  
  const dropdownRef = useRef(null);
  const calendarRef = useRef(null);

  // State untuk notifikasi hasil cron
  const [cronLoading, setCronLoading] = useState(false);
  const [cronMessage, setCronMessage] = useState(null);

  // Set default kategori saat tipe berubah
  useEffect(() => {
    setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }, [type]);

  // Tutup dropdown/kalender saat mengklik luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
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
    if (!dateString) return 'Pilih Tanggal Mulai';
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
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = nextDueDate === dayStr;
      
      const today = new Date();
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => {
            setNextDueDate(dayStr);
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

  const handleToggleAddForm = () => {
    if (!showAddForm) {
      setType('expense');
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setFrequency('monthly');
      setNote('');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setNextDueDate(`${year}-${month}-${day}`);
      setViewDate(today);
      setFormError('');
    }
    setShowAddForm(!showAddForm);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const rawAmount = parseRawNumber(amount);
    if (!rawAmount || rawAmount <= 0) return setFormError('Nominal transaksi harus lebih besar dari 0');
    if (!nextDueDate) return setFormError('Tanggal jatuh tempo pertama wajib ditentukan');

    setSubmitting(true);
    const res = await addRecurringTemplate({
      type,
      category,
      amount: rawAmount,
      frequency,
      note: note.trim(),
      next_due_date: nextDueDate
    });

    setSubmitting(false);
    if (res.success) {
      handleToggleAddForm();
    } else {
      setFormError(res.message || 'Gagal menyimpan transaksi berulang');
    }
  };

  const handleCronTrigger = async () => {
    setCronLoading(true);
    setCronMessage(null);
    const res = await triggerProcessRecurring();
    setCronLoading(false);
    if (res.success) {
      setCronMessage({
        type: 'success',
        text: res.message || 'Proses penyelarasan selesai.'
      });
      // Otomatis hilangkan notif setelah 5 detik
      setTimeout(() => setCronMessage(null), 5000);
    } else {
      setCronMessage({
        type: 'error',
        text: res.message || 'Gagal memproses transaksi berulang.'
      });
    }
  };

  const handleToggleSwitch = async (id, currentStatus) => {
    await toggleRecurringActive(id, !currentStatus);
  };

  const getFrequencyLabel = (freq) => {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 group select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <RefreshCw size={16} className="animate-spin-slow" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Transaksi Berulang (Recurring)</h3>
          </div>
          <p className="text-xs text-slate-500">Automasi pencatatan tagihan rutin atau pemasukan pasif bulanan Anda</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cron Action Button */}
          <button
            onClick={handleCronTrigger}
            disabled={cronLoading}
            title="Proses manual template transaksi yang jatuh tempo sekarang"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Clock size={13} className={cronLoading ? 'animate-spin' : ''} />
            <span>Sinkronisasi</span>
          </button>

          {/* Toggle Form Button */}
          <button
            onClick={handleToggleAddForm}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-300 ${
              showAddForm 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/10'
            }`}
          >
            {showAddForm ? <X size={13} /> : <Plus size={13} />}
            {showAddForm ? 'Batal' : 'Buat Templat'}
          </button>
        </div>
      </div>

      {/* NOTIFIKASI HASIL CRON SINKRONISASI */}
      {cronMessage && (
        <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
          cronMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
            : 'bg-rose-50 border-rose-100 text-rose-600'
        }`}>
          {cronMessage.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
          <p className="font-semibold leading-relaxed">{cronMessage.text}</p>
        </div>
      )}

      {/* FORM TAMBAH TEMPLAT BERULANG */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="mb-6 p-5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-4 animate-fade-in text-xs relative z-50">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-500" />
            Atur Transaksi Berulang Baru
          </h4>
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* TIPE TRANSAKSI SWITCHER */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Transaksi</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-white border border-slate-200/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    type === 'expense' 
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/10' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pengeluaran Rutin
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    type === 'income' 
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pemasukan Rutin
                </button>
              </div>
            </div>

            {/* BARIS UTAMA: NOMINAL, FREKUENSI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nominal Transaksi (Rp)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1.500.000"
                    value={amount}
                    onChange={e => setAmount(formatThousands(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Frekuensi Pengulangan</label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-white border border-slate-200/50 rounded-xl h-[38px] items-center">
                  {FREQUENCIES.map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFrequency(freq.value)}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${
                        frequency === freq.value 
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BARIS KEDUA: KATEGORI DROPDOWN, TANGGAL MULAI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* KUSTOM SELECT DROPDOWN KATEGORI */}
              <div className="relative z-40" ref={dropdownRef}>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Transaksi</label>
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

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-100 shadow-xl rounded-xl py-1 text-xs select-none max-h-48 overflow-y-auto animate-fade-in">
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

              {/* TANGGAL JATUH TEMPO (CUSTOM CALENDAR) */}
              <div className="relative" ref={calendarRef}>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Mulai / Jatuh Tempo Pertama</label>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-700 bg-white flex items-center justify-between active:scale-[0.99] select-none"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Calendar size={15} className="text-slate-400" />
                    {formatFriendlyDate(nextDueDate)}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${
                      isCalendarOpen ? 'transform rotate-180 text-blue-500' : ''
                    }`} 
                  />
                </button>

                {isCalendarOpen && (
                  <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[1.5px] z-50 flex items-center justify-center p-4 select-none animate-fade-in">
                    <div 
                      className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-5 w-72 relative animate-fade-in"
                      onClick={e => e.stopPropagation()}
                    >
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

                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                          <div key={d} className="h-6 flex items-center justify-center">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {renderCalendarDays()}
                      </div>

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
            </div>

            {/* INPUT CATATAN / NOTE */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="misal: Langganan Netflix Premium, Listrik bulanan"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Templat Transaksi Berulang'}
          </button>
        </form>
      )}

      {/* DAFTAR TEMPLAT BERULANG AKTIF */}
      <div className="space-y-4">
        {recurringTemplates && recurringTemplates.length > 0 ? (
          recurringTemplates.map((template) => {
            const isExpense = template.type === 'expense';
            const isCompleted = false; // template berulang berjalan tanpa batas hingga di-disable
            
            return (
              <div 
                key={template.id} 
                className={`p-4 border rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  template.is_active ? 'border-slate-100 bg-slate-50/10' : 'border-slate-100 bg-slate-50/40 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Badge tipe transaksi */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    isExpense 
                      ? 'bg-rose-50 text-rose-600 border-rose-100/50' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                  }`}>
                    {isExpense ? <ArrowDownLeft size={18} className="stroke-[2.5]" /> : <ArrowUpRight size={18} className="stroke-[2.5]" />}
                  </div>

                  {/* Detil Kategori & Catatan */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm truncate">{template.category}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isExpense 
                          ? 'text-rose-600 bg-rose-50 border border-rose-100/30' 
                          : 'text-emerald-600 bg-emerald-50 border border-emerald-100/30'
                      }`}>
                        {getFrequencyLabel(template.frequency)}
                      </span>
                    </div>
                    {template.note && <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{template.note}</p>}
                    
                    {/* Tanggal Jatuh Tempo Berikutnya */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-1">
                      <Clock size={11} />
                      <span>Jatuh Tempo: <strong className="text-slate-500 font-bold">{formatFriendlyDate(template.next_due_date)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  {/* Info Jumlah Pemasukan/Pengeluaran */}
                  <div className="text-left sm:text-right select-none">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Jumlah berkala</span>
                    <span className={`text-sm font-extrabold block ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isExpense ? '-' : '+'}{formatRupiah(template.amount)}
                    </span>
                  </div>

                  {/* Action Panel: Toggle Switch & Delete */}
                  <div className="flex items-center gap-3">
                    
                    {/* TOGGLE SWITCH KUSTOM */}
                    <button
                      type="button"
                      onClick={() => handleToggleSwitch(template.id, template.is_active)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        template.is_active ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          template.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Tombol Hapus */}
                    <button
                      onClick={() => removeRecurringTemplate(template.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-slate-100 transition-all"
                      title="Hapus templat"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 py-12 gap-2.5 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <RefreshCw size={28} className="stroke-[1.5] text-slate-300" />
            <p className="text-xs font-semibold">Belum ada template transaksi berulang diatur</p>
            <button
              onClick={handleToggleAddForm}
              className="text-[10px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100/30 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all mt-1"
            >
              Atur Transaksi Berulang Pertama Anda
            </button>
          </div>
        )}
      </div>

      {/* FOOTER INFO BADGE */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0">
          <Info size={13} className="text-blue-600" />
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
          Mesin Cron KeuanganKu memantau template ini secara otomatis setiap malam. Ketika tanggal jatuh tempo terlewati, sistem akan otomatis mencatatkan pengeluaran/pemasukan tersebut ke dalam riwayat transaksi Anda. Anda juga bisa menekan tombol <strong>Sinkronisasi</strong> di kanan atas untuk memprosesnya secara manual kapan saja.
        </p>
      </div>

    </div>
  );
}
