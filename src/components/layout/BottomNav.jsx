import { useState } from 'react';
import {
  LayoutDashboard,
  PieChart,
  Plus,
  Receipt,
  Target,
  Calculator,
  User,
  Tags,
  MoreHorizontal
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onAddClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownItems = [
    { id: 'categories', label: 'Kategori', icon: Tags },
    { id: 'goals', label: 'Target', icon: Target },
    { id: 'calculator', label: 'Kalkulator', icon: Calculator },
    { id: 'profile', label: 'Akun', icon: User }
  ];

  const isDropdownActive = dropdownItems.some(item => item.id === activeTab);

  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 z-50 px-3 select-none">
      <div className="backdrop-blur-md bg-white/80 border border-slate-200/50 shadow-xl shadow-slate-900/5 rounded-2xl py-2.5 px-2 flex justify-around items-center max-w-lg mx-auto relative gap-0.5">
        
        {/* Transparent click-outside backdrop overlay to dismiss dropdown */}
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsDropdownOpen(false)}
          />
        )}

        {/* Upward Dropdown Menu "Lainnya" */}
        {isDropdownOpen && (
          <div className="absolute bottom-[80px] right-3 z-50 w-48 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-2xl shadow-slate-900/5 rounded-2xl p-1.5 flex flex-col gap-0.5 animate-fade-in origin-bottom-right transition-all">
            {dropdownItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 w-full relative ${
                    isActive 
                      ? 'bg-blue-50/70 text-blue-600 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-50/60'
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`transition-transform duration-200 ${
                      isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[11px] font-bold">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-4 bg-blue-600 rounded-full ml-auto animate-fade-in" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 1. Dashboard */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setIsDropdownOpen(false);
          }}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-300 relative group flex-1 animate-pulse-subtle"
        >
          {activeTab === 'dashboard' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <LayoutDashboard
            size={19}
            className={`transition-transform duration-300 ${
              activeTab === 'dashboard'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-95'
            }`}
          />
          <span
            className={`text-[9.5px] mt-1 font-bold transition-colors duration-200 truncate max-w-[60px] ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Dashboard
          </span>
        </button>

        {/* 2. Transaksi */}
        <button
          onClick={() => {
            setActiveTab('transactions');
            setIsDropdownOpen(false);
          }}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {activeTab === 'transactions' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <Receipt
            size={19}
            className={`transition-transform duration-300 ${
              activeTab === 'transactions'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-95'
            }`}
          />
          <span
            className={`text-[9.5px] mt-1 font-bold transition-colors duration-200 truncate max-w-[60px] ${
              activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Transaksi
          </span>
        </button>

        {/* 3. TOMBOL TENGAH: CATAT TRANSAKSI BARU (MELAYANG / FLOATING) */}
        <button
          onClick={() => {
            onAddClick();
            setIsDropdownOpen(false);
          }}
          className="flex flex-col items-center justify-center -mt-8 shrink-0 z-20 flex-1 group focus:outline-none"
          title="Catat Transaksi Baru"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border-[3px] border-white transition-all duration-200 group-active:scale-90 hover:bg-blue-700">
            <Plus size={20} className="stroke-[3]" />
          </div>
          <span className="text-[9.5px] mt-1.5 font-extrabold text-blue-600 tracking-wider">Catat</span>
        </button>

        {/* 4. Anggaran */}
        <button
          onClick={() => {
            setActiveTab('budgets');
            setIsDropdownOpen(false);
          }}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {activeTab === 'budgets' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <PieChart
            size={19}
            className={`transition-transform duration-300 ${
              activeTab === 'budgets'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-95'
            }`}
          />
          <span
            className={`text-[9.5px] mt-1 font-bold transition-colors duration-200 truncate max-w-[60px] ${
              activeTab === 'budgets' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Anggaran
          </span>
        </button>

        {/* 5. Lainnya (Dropdown Menu Opsi Tambahan) */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {isDropdownActive && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <MoreHorizontal
            size={19}
            className={`transition-transform duration-300 ${
              isDropdownActive
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-95'
            }`}
          />
          <span
            className={`text-[9.5px] mt-1 font-bold transition-colors duration-200 truncate max-w-[60px] ${
              isDropdownActive ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Lainnya
          </span>
        </button>

      </div>
    </div>
  );
}

