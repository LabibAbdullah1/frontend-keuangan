import {
  LayoutDashboard,
  PieChart,
  Plus,
  Receipt,
  Target
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onAddClick }) {
  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 z-50 px-4 select-none">
      <div className="backdrop-blur-md bg-white/80 border border-slate-200/50 shadow-xl shadow-slate-900/5 rounded-2xl py-1.5 px-2 flex justify-around items-center max-w-md mx-auto relative">

        {/* 1. Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {activeTab === 'dashboard' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <LayoutDashboard
            size={18}
            className={`transition-transform duration-300 ${
              activeTab === 'dashboard'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-90'
            }`}
          />
          <span
            className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
              activeTab === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            Dashboard
          </span>
        </button>

        {/* 2. Transaksi */}
        <button
          onClick={() => setActiveTab('transactions')}
          className="flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {activeTab === 'transactions' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <Receipt
            size={18}
            className={`transition-transform duration-300 ${
              activeTab === 'transactions'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-90'
            }`}
          />
          <span
            className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
              activeTab === 'transactions' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            Transaksi
          </span>
        </button>

        {/* 3. TOMBOL TENGAH: CATAT TRANSAKSI BARU (MELAYANG / FLOATING) */}
        <button
          onClick={onAddClick}
          className="flex flex-col items-center justify-center -mt-6 shrink-0 z-20 flex-1 group focus:outline-none"
          title="Catat Transaksi Baru"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border-[3px] border-white transition-all duration-200 group-active:scale-90 hover:bg-blue-700">
            <Plus size={20} className="stroke-[3]" />
          </div>
          <span className="text-[9px] mt-1 font-bold text-blue-600 tracking-wider">Catat</span>
        </button>

        {/* 4. Anggaran */}
        <button
          onClick={() => setActiveTab('budgets')}
          className="flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {activeTab === 'budgets' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <PieChart
            size={18}
            className={`transition-transform duration-300 ${
              activeTab === 'budgets'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-90'
            }`}
          />
          <span
            className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
              activeTab === 'budgets' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            Anggaran
          </span>
        </button>

        {/* 5. Target Tabungan */}
        <button
          onClick={() => setActiveTab('goals')}
          className="flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-300 relative group flex-1"
        >
          {activeTab === 'goals' && (
            <span className="absolute inset-0 bg-blue-50/70 rounded-xl -z-10 animate-fade-in scale-90" />
          )}
          <Target
            size={18}
            className={`transition-transform duration-300 ${
              activeTab === 'goals'
                ? 'text-blue-600 stroke-[2.2] scale-110'
                : 'text-slate-400 group-active:scale-90'
            }`}
          />
          <span
            className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
              activeTab === 'goals' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            Target
          </span>
        </button>

      </div>
    </div>
  );
}
