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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex items-center justify-between relative overflow-hidden group`}
          >
            {/* Soft background shape */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full -z-0 opacity-10 transition-transform duration-500 group-hover:scale-125 ${
              card.color === 'blue' ? 'bg-blue-500' : card.color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />

            <div className="space-y-2 relative z-10">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatRupiah(card.amount)}
              </h2>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  card.color === 'blue' 
                    ? 'bg-blue-50 text-blue-600' 
                    : card.color === 'emerald' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                  Bulan Ini
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Real-time</span>
              </div>
            </div>

            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm relative z-10 transition-transform duration-300 group-hover:rotate-3 ${card.iconColor}`}>
              <Icon size={22} className="stroke-[2.2]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
