import {
  LayoutDashboard,
  LogOut,
  PieChart,
  Receipt,
  Target,
  Wallet
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'budgets', label: 'Anggaran', icon: PieChart },
    { id: 'goals', label: 'Target Tabungan', icon: Target },
  ];

  // Helper untuk mendapatkan inisial dari username/nama
  const getInitials = (name = '') => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen fixed top-0 left-0 bottom-0 shrink-0 select-none z-30">
      {/* BRANDING */}
      <div className="h-20 flex items-center px-6 border-b border-slate-50 gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10 transition-transform duration-300 hover:rotate-6">
          <Wallet size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">KeuanganKu</h1>
          <span className="text-[10px] font-medium text-blue-600 tracking-wider uppercase mt-1 inline-block">Pro Tracker</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50/70 text-blue-600 font-semibold shadow-sm shadow-blue-500/5'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                size={18}
                className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              />
              {item.label}
              {isActive && (
                <span className="w-1.5 h-6 bg-blue-600 rounded-full ml-auto animate-fade-in" />
              )}
            </button>
          );
        })}
      </nav>

      {/* USER PROFILE & FOOTER */}
      <div className="p-4 border-t border-slate-50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/70 border border-slate-100/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-black/10">
            {getInitials(user?.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate capitalize">{user?.username || 'Guest'}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user?.email || 'Premium Member'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white transition-colors duration-200 focus:outline-none"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
