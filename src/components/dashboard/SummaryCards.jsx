import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

export default function SummaryCards({ summary }) {
  const cards = [
    {
      title: 'Total Saldo',
      amount: summary.balance,
      icon: Wallet,
      color: 'blue',
      bgColor: 'bg-blue-50/70 border-blue-100/50',
      iconColor: 'text-blue-600 bg-blue-50 border-blue-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Pemasukan',
      amount: summary.total_income,
      icon: ArrowDownLeft,
      color: 'emerald',
      bgColor: 'bg-emerald-50/50 border-emerald-100/40',
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Total Pengeluaran',
      amount: summary.total_expense,
      icon: ArrowUpRight,
      color: 'rose',
      bgColor: 'bg-rose-50/50 border-rose-100/40',
      iconColor: 'text-rose-600 bg-rose-50 border-rose-100',
      textColor: 'text-rose-700'
    }
  ];

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. KARTU UTAMA (TOTAL SALDO) - Selalu Stand Out dengan Gradien Mewah */}
      <div className="md:col-span-1 bg-gradient-to-br from-blue-600 via-indigo-650 to-indigo-800 text-white border border-indigo-500/20 shadow-md shadow-blue-600/10 rounded-2xl p-5 sm:p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
        {/* Decorative elements */}
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute left-6 bottom-4 w-12 h-8 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm pointer-events-none" /> {/* Card Sim Chip look */}
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-bold text-blue-100 uppercase tracking-widest">Total Saldo</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              {formatRupiah(summary.balance)}
            </h2>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/10 uppercase tracking-tight">
                Dompetku
              </span>
              <span className="text-[9px] text-blue-200 font-semibold">Real-time</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-3 transition-transform duration-300">
            <Wallet size={20} className="stroke-[2.2] text-white" />
          </div>
        </div>
      </div>

      {/* SUB-CARDS PEMASUKAN & PENGELUARAN (Berdampingan di mobile, berjejer di desktop) */}
      <div className="grid grid-cols-2 md:contents gap-4">
        {/* 2. KARTU PEMASUKAN */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between justify-between relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-emerald-500 opacity-[0.04] transition-transform duration-500 group-hover:scale-125" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pemasukan</span>
            <h3 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
              {formatRupiah(summary.total_income)}
            </h3>
            <div className="flex items-center gap-1 pt-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                Bulan Ini
              </span>
            </div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:-rotate-3 mt-2 sm:mt-0">
            <ArrowDownLeft size={18} className="stroke-[2.5]" />
          </div>
        </div>

        {/* 3. KARTU PENGELUARAN */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between justify-between relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-rose-500 opacity-[0.04] transition-transform duration-500 group-hover:scale-125" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pengeluaran</span>
            <h3 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
              {formatRupiah(summary.total_expense)}
            </h3>
            <div className="flex items-center gap-1 pt-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600">
                Bulan Ini
              </span>
            </div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-50 border border-rose-100/60 text-rose-600 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:rotate-3 mt-2 sm:mt-0">
            <ArrowUpRight size={18} className="stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
