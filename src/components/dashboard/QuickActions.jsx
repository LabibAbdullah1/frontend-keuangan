import React from 'react';
import { 
  Sparkles, 
  Plus, 
  PieChart, 
  Target, 
  Tags, 
  Calculator, 
  Heart, 
  Receipt 
} from 'lucide-react';

export default function QuickActions({ 
  setActiveTab, 
  setIsModalOpen, 
  dashboardMode, 
  changeDashboardMode, 
  partnerInfo 
}) {
  const actions = [
    {
      id: 'ai-chat',
      label: 'Tanya AI',
      icon: Sparkles,
      color: 'from-amber-400 to-orange-500 shadow-orange-500/10',
      bgColor: 'bg-amber-50 text-amber-600',
      action: () => setActiveTab('ai-chat')
    },
    {
      id: 'add-tx',
      label: 'Transaksi Baru',
      icon: Plus,
      color: 'from-blue-500 to-indigo-600 shadow-blue-500/10',
      bgColor: 'bg-blue-50 text-blue-600',
      action: () => setIsModalOpen(true)
    },
    {
      id: 'budgets',
      label: 'Anggaran',
      icon: PieChart,
      color: 'from-purple-500 to-indigo-500 shadow-purple-500/10',
      bgColor: 'bg-purple-50 text-purple-600',
      action: () => setActiveTab('budgets')
    },
    {
      id: 'goals',
      label: 'Tabungan',
      icon: Target,
      color: 'from-rose-500 to-pink-500 shadow-rose-500/10',
      bgColor: 'bg-rose-50 text-rose-600',
      action: () => setActiveTab('goals')
    },
    {
      id: 'transactions',
      label: 'Riwayat',
      icon: Receipt,
      color: 'from-teal-500 to-emerald-500 shadow-teal-500/10',
      bgColor: 'bg-teal-50 text-teal-600',
      action: () => setActiveTab('transactions')
    },
    {
      id: 'categories',
      label: 'Kategori',
      icon: Tags,
      color: 'from-sky-400 to-blue-500 shadow-sky-500/10',
      bgColor: 'bg-sky-50 text-sky-600',
      action: () => setActiveTab('categories')
    },
    {
      id: 'calculator',
      label: 'Kalkulator',
      icon: Calculator,
      color: 'from-fuchsia-500 to-pink-500 shadow-fuchsia-500/10',
      bgColor: 'bg-fuchsia-50 text-fuchsia-600',
      action: () => setActiveTab('calculator')
    },
    {
      id: 'couple',
      label: partnerInfo ? (dashboardMode === 'couple' ? 'Mode Mandiri' : 'Mode Pasangan') : 'Set Pasangan',
      icon: Heart,
      color: partnerInfo ? 'from-pink-500 to-rose-600 shadow-pink-500/10' : 'from-slate-400 to-slate-500 shadow-slate-500/10',
      bgColor: partnerInfo ? 'bg-pink-50 text-pink-600' : 'bg-slate-50 text-slate-500',
      action: () => {
        if (partnerInfo) {
          changeDashboardMode(dashboardMode === 'couple' ? 'personal' : 'couple');
        } else {
          setActiveTab('profile'); // Buka profil untuk pasang link/invite
        }
      }
    }
  ];

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 select-none animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Akses Cepat</h3>
        <span className="text-[10px] text-blue-600 font-bold hidden sm:inline">Pintasan Fitur Utama</span>
      </div>

      {/* Horizontally scrollable row on mobile, 8-column grid on desktop */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-8 gap-5 sm:gap-6 pb-2 md:pb-0 scrollbar-none snap-x snap-mandatory justify-start md:justify-items-center w-full">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.action}
              className="flex-none w-[70px] md:w-auto snap-start flex flex-col items-center gap-2 group focus:outline-none w-full max-w-[70px]"
            >
              {/* Bulatan Icon dengan Efek Hover Premium */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 active:scale-95 group-hover:shadow-md ${act.bgColor} border border-transparent group-hover:border-slate-100`}>
                <Icon size={20} className="stroke-[2.2] transition-transform duration-300 group-hover:rotate-6" />
              </div>
              
              {/* Teks Label Kompak */}
              <span className="text-[10px] font-bold text-slate-600 text-center tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[24px]">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
