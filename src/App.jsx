import React, { useState } from 'react';
import { useFinance } from './hooks/useFinance';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import SummaryCards from './components/dashboard/SummaryCards';
import ChartsSection from './components/dashboard/ChartsSection';
import BudgetsSection from './components/dashboard/BudgetsSection';
import GoalsSection from './components/dashboard/GoalsSection';
import TransactionList from './components/dashboard/TransactionList';
import TransactionModal from './components/dashboard/TransactionModal';
import Auth from './components/auth/Auth';

import { 
  Plus, 
  Calendar, 
  Heart, 
  Info, 
  ChevronRight, 
  Wallet,
  WifiOff,
  CloudLightning,
  Sparkles,
  LogOut
} from 'lucide-react';
import { formatRupiah } from './utils/format';

export default function App() {
  const {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    transactions,
    budgets,
    goals,
    summary,
    categoryExpenses,
    cashflowTrend,
    financialHealth,
    loading,
    error,
    isDemo,
    addTransaction,
    removeTransaction,
    addBudget,
    removeBudget,
    addGoal,
    contributeGoal,
    removeGoal
  } = useFinance();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dapatkan salam ramah dinamis berdasarkan waktu lokal saat ini
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi 🌅';
    if (hour < 15) return 'Selamat Siang ☀️';
    if (hour < 19) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌌';
  };

  const getGreetingQuote = () => {
    const quotes = [
      'Disiplin finansial hari ini adalah kemerdekaan finansial esok.',
      'Ayo pantau arus kas Anda dan wujudkan tabungan impian!',
      'Hemat pangkal kaya, atur anggaran bulanan Anda dengan bijak.',
      'Satu rupiah yang Anda hemat adalah langkah menuju masa depan cerah.'
    ];
    // Ambil kutipan acak per hari berdasarkan tanggal saat ini
    const idx = new Date().getDate() % quotes.length;
    return quotes[idx];
  };

  if (!isAuthenticated) {
    return <Auth login={login} register={register} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 select-none">
        <div className="relative flex items-center justify-center">
          {/* Pulsating ring */}
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 animate-pulse" />
          <div className="absolute w-12 h-12 rounded-full border-t-4 border-blue-600 animate-spin" />
        </div>
        <div className="text-center space-y-1 animate-pulse">
          <p className="text-sm font-bold text-slate-800 tracking-tight">Memuat Data Keuangan...</p>
          <p className="text-[10px] text-slate-400 font-medium">Menyinkronkan transaksi Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 overflow-x-hidden font-sans">
      
      {/* 1. SIDEBAR NAVIGATION (DESKTOP) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout} />

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-h-screen pb-28 lg:pb-8 overflow-y-auto px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* BANNER DEMO MODE RESILIEN (Muncul jika database/API luring) */}
        {isDemo && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-sm shadow-amber-500/5 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <WifiOff size={14} />
              </div>
              <div>
                <p className="font-bold">Mode Offline Aktif</p>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">Database backend cPanel belum terhubung. Perubahan Anda disimpan sementara di memori browser (LocalStorage).</p>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-lg border border-amber-200 text-amber-700 shrink-0">Demo Live</span>
          </div>
        )}

        {/* 3. HEADER AREA (GREETINGS, DATES, HEALTH SCORE & ACTION TOMBOL) */}
        <header className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 select-none">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles size={11} className="stroke-[2.5]" />
              Personal Finance Hub
            </span>
            <h2 className="text-xl font-extrabold text-slate-950 tracking-tight capitalize flex items-center justify-between lg:block">
              <span>{getGreeting()}, {user?.username || 'User'}!</span>
              {/* Tombol Logout Khusus Seluler (Mobile) di Header */}
              <button
                onClick={logout}
                title="Keluar"
                className="lg:hidden flex items-center justify-center p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-100 transition-all focus:outline-none"
              >
                <LogOut size={15} />
              </button>
            </h2>
            <p className="text-xs text-slate-500 font-medium">{getGreetingQuote()}</p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Kalender widget */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 shadow-sm rounded-xl text-xs text-slate-500 font-semibold">
              <Calendar size={14} className="text-slate-400" />
              <span>{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())}</span>
            </div>

            {/* Catat Transaksi Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus size={15} className="stroke-[2.5]" />
              Transaksi Baru
            </button>
          </div>
        </header>

        {/* 4. RATING KESEHATAN FINANSIAL (DI ATAS DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <section className="mt-6 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-inner">
                <Heart size={20} className="fill-white/20 stroke-[2]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Skor Kesehatan Finansial:</h4>
                  <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                    {financialHealth.health_score}/100 — {financialHealth.rating}
                  </span>
                </div>
                {financialHealth.recommendations.length > 0 && (
                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-1">
                    👉 {financialHealth.recommendations[0]}
                  </p>
                )}
              </div>
            </div>
            {/* Panel rekomendasi popup toggle or detail indicator */}
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50/50 hover:bg-blue-50 border border-blue-100/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
              <Info size={12} />
              <span>Detail Analisis</span>
            </div>
          </section>
        )}

        {/* 5. SECTIONS SWITCHER */}
        <div className="mt-6 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* 3 Summary Cards */}
              <SummaryCards summary={summary} />

              {/* Charts Section */}
              <ChartsSection cashflowTrend={cashflowTrend} categoryExpenses={categoryExpenses} />

              {/* Grid 2 Column: Budgets & Goals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BudgetsSection 
                  budgets={budgets} 
                  transactions={transactions} 
                  addBudget={addBudget} 
                  removeBudget={removeBudget} 
                />
                <GoalsSection 
                  goals={goals} 
                  addGoal={addGoal} 
                  contributeGoal={contributeGoal} 
                  removeGoal={removeGoal} 
                />
              </div>

              {/* Recent Transactions List (Limit 5) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transaksi Terakhir</h4>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Lihat Semua
                    <ChevronRight size={14} />
                  </button>
                </div>
                <TransactionList 
                  transactions={transactions.slice(0, 5)} 
                  removeTransaction={removeTransaction} 
                />
              </div>

            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-fade-in">
              <TransactionList 
                transactions={transactions} 
                removeTransaction={removeTransaction} 
              />
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="animate-fade-in">
              <BudgetsSection 
                budgets={budgets} 
                transactions={transactions} 
                addBudget={addBudget} 
                removeBudget={removeBudget} 
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="animate-fade-in">
              <GoalsSection 
                goals={goals} 
                addGoal={addGoal} 
                contributeGoal={contributeGoal} 
                removeGoal={removeGoal} 
              />
            </div>
          )}
        </div>

      </main>

      {/* 6. BOTTOM NAVIGATION (MOBILE) */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 7. POPUP MODAL TRANSAKSI BARU */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        addTransaction={addTransaction} 
      />

    </div>
  );
}
