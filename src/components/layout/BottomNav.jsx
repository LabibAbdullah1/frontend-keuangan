import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Target 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'budgets', label: 'Anggaran', icon: PiggyBank },
    { id: 'goals', label: 'Target', icon: Target },
  ];

  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 z-50 px-4 select-none">
      <div className="backdrop-blur-md bg-white/80 border border-slate-200/50 shadow-xl shadow-slate-900/5 rounded-2xl py-2 px-3 flex justify-around items-center max-w-md mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 relative group flex-1"
            >
              {isActive && (
                <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
              )}
              <Icon 
                size={18} 
                className={`transition-transform duration-300 ${
                  isActive 
                    ? 'text-blue-600 stroke-[2.2] scale-110' 
                    : 'text-slate-400 group-active:scale-90'
                }`} 
              />
              <span 
                className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
