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
import RecurringSection from './components/dashboard/RecurringSection';
import ProfileSection from './components/dashboard/ProfileSection';
import CalculatorSection from './components/dashboard/CalculatorSection';
import CategorySection from './components/dashboard/CategorySection';
import Auth from './components/auth/Auth';
import OnboardingModal from './components/layout/OnboardingModal';
import AIChatSection from './components/dashboard/AIChatSection';
import QuickActions from './components/dashboard/QuickActions';


import {
  Plus,
  Calendar,
  Heart,
  Info,
  ChevronRight,
  WifiOff,
  CloudLightning,
  Sparkles,
  LogOut,
  RefreshCw,
  AlertTriangle,
  X
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
    budgetForecasts,
    loading,
    error,
    isDemo,
    isOffline,
    isSyncing,
    syncQueueLength,
    dashboardMode,
    changeDashboardMode,
    partnerInfo,
    incomingInvites,
    sendCoupleInvite,
    acceptCoupleInvite,
    rejectCoupleInvite,
    disconnectCouple,
    addTransaction,
    removeTransaction,
    addBudget,
    removeBudget,
    addGoal,
    contributeGoal,
    removeGoal,
    recurringTemplates,
    categories,
    addRecurringTemplate,
    toggleRecurringActive,
    removeRecurringTemplate,
    triggerProcessRecurring,
    updateUserProfile,
    addCategory,
    editCategory,
    removeCategory,
    refreshData
  } = useFinance();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactionSubTab, setTransactionSubTab] = useState('history'); // 'history' or 'recurring'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const [profilePic, setProfilePic] = useState(localStorage.getItem(`user_avatar_${user?.id}`) || '');
  const [pendingInvite, setPendingInvite] = useState(null);

  // Tangkap parameter query undangan QR (?invite=email&name=username)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteEmail = urlParams.get('invite');
    const inviteName = urlParams.get('name');
    if (inviteEmail) {
      const inviteData = { email: inviteEmail, name: inviteName || inviteEmail };
      sessionStorage.setItem('pending_invite', JSON.stringify(inviteData));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Periksa sisa undangan QR setelah login berhasil
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const savedInvite = sessionStorage.getItem('pending_invite');
      if (savedInvite) {
        try {
          const parsed = JSON.parse(savedInvite);
          if (parsed.email !== user.email) {
            setPendingInvite(parsed);
          } else {
            sessionStorage.removeItem('pending_invite');
          }
        } catch (e) {
          sessionStorage.removeItem('pending_invite');
        }
      }
    }
  }, [isAuthenticated, user]);

  // Polling data kemitraan & undangan masuk setiap 8 detik agar real-time
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      refreshData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshData]);

  React.useEffect(() => {
    setProfilePic(localStorage.getItem(`user_avatar_${user?.id}`) || '');
  }, [user]);

  React.useEffect(() => {
    const handleAuthChange = () => {
      setProfilePic(localStorage.getItem(`user_avatar_${user?.id}`) || '');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [user]);

  React.useEffect(() => {
    if (user?.id) {
      const completed = localStorage.getItem(`has_completed_onboarding_${user.id}`);
      if (!completed) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user]);

  // Restore navigation tab states on load
  React.useEffect(() => {
    if (user?.id) {
      const savedTab = localStorage.getItem(`active_tab_${user.id}`);
      if (savedTab) {
        setActiveTab(savedTab);
      }
      const savedSubTab = localStorage.getItem(`transaction_sub_tab_${user.id}`);
      if (savedSubTab) {
        setTransactionSubTab(savedSubTab);
      }
    }
  }, [user]);

  // Persist activeTab and reset window scroll to top
  React.useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`active_tab_${user.id}`, activeTab);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, user]);

  // Persist transactionSubTab
  React.useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`transaction_sub_tab_${user.id}`, transactionSubTab);
    }
  }, [transactionSubTab, user]);

  // Global Delete Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const handleConfirmDelete = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Interseptor aksi hapus untuk menampilkan modal konfirmasi
  const handleRemoveTransaction = (id) => {
    handleConfirmDelete(
      'Hapus Catatan Transaksi',
      'Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      () => removeTransaction(id)
    );
  };

  const handleRemoveBudget = (id) => {
    handleConfirmDelete(
      'Hapus Batas Anggaran',
      'Apakah Anda yakin ingin menghapus batas anggaran kategori ini? Tindakan ini tidak dapat dibatalkan.',
      () => removeBudget(id)
    );
  };

  const handleRemoveGoal = (id) => {
    handleConfirmDelete(
      'Hapus Target Tabungan',
      'Apakah Anda yakin ingin menghapus target tabungan impian ini? Tindakan ini tidak dapat dibatalkan.',
      () => removeGoal(id)
    );
  };

  const handleRemoveRecurringTemplate = (id) => {
    handleConfirmDelete(
      'Hapus Transaksi Berulang',
      'Apakah Anda yakin ingin menghapus template transaksi berulang ini? Tindakan ini tidak dapat dibatalkan.',
      () => removeRecurringTemplate(id)
    );
  };

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
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={logout}
        dashboardMode={dashboardMode}
        changeDashboardMode={changeDashboardMode}
        partnerInfo={partnerInfo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 min-w-0">
        <main className="flex-1 flex flex-col pb-28 lg:pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* BANNER STATUS KONEKSI & SINKRONISASI PREMIUM */}
        {(isOffline || isDemo || isSyncing || syncQueueLength > 0) && (
          <div className={`mt-4 p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md backdrop-blur-md select-none animate-fade-in ${
            isSyncing 
              ? 'bg-blue-50/95 border-blue-200/60 text-blue-900 shadow-blue-500/5' 
              : (isOffline || isDemo) 
                ? 'bg-amber-50/95 border-amber-200/60 text-amber-900 shadow-amber-500/5'
                : 'bg-emerald-50/95 border-emerald-200/60 text-emerald-900 shadow-emerald-500/5'
          }`}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                isSyncing 
                  ? 'bg-blue-600' 
                  : (isOffline || isDemo) 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
              }`}>
                {isSyncing ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (isOffline || isDemo) ? (
                  <WifiOff size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] tracking-tight leading-none text-slate-900 flex items-center gap-1.5 flex-wrap">
                  {isSyncing 
                    ? 'Sinkronisasi Data Berlangsung...' 
                    : (isOffline || isDemo) 
                      ? 'Mode Offline Aktif (Data Tersimpan Aman)' 
                      : 'Semua Data Berhasil Tersinkronisasi'}
                  {(isOffline || isDemo) && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200 font-extrabold shadow-2xs">
                      🔒 Enkripsi Lokal
                    </span>
                  )}
                </p>
                <p className="text-[10.5px] leading-relaxed text-slate-600 mt-1 font-medium">
                  {isSyncing 
                    ? `Sedang mengunggah ${syncQueueLength} perubahan ke server secara aman. Mohon jangan menutup aplikasi.` 
                    : (isOffline || isDemo) 
                      ? `Jangan khawatir! Koneksi Anda terputus, tetapi Anda tetap bisa menggunakan aplikasi secara normal. Semua perubahan disimpan dengan aman di penyimpanan lokal Anda dan akan disinkronkan secara otomatis begitu internet terhubung kembali.`
                      : 'Semua perubahan offline Anda telah diverifikasi dan disinkronkan ke server secara aman.'}
                </p>
              </div>
            </div>
            {syncQueueLength > 0 && !isSyncing && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 px-3 py-1 rounded-xl border border-amber-200 text-amber-800 shadow-sm shrink-0 self-start sm:self-center">
                {syncQueueLength} Perubahan Tertunda
              </span>
            )}
            {isSyncing && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 px-3 py-1 rounded-xl border border-blue-200 text-blue-800 shadow-sm shrink-0 animate-pulse self-start sm:self-center">
                Sinkronisasi...
              </span>
            )}
          </div>
        )}

        {/* 3. HEADER AREA (GREETINGS, DATES, HEALTH SCORE & ACTION TOMBOL) */}
        <header className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 select-none">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles size={11} className="stroke-[2.5]" />
              {dashboardMode === 'couple' ? 'Couple Finance Hub 🧑‍🤝‍🧑' : 'Personal Finance Hub'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-950 tracking-tight capitalize flex items-center justify-between lg:block">
              <span className="flex flex-col md:flex-row md:items-center md:gap-1.5">
                <span>{getGreeting()},</span>
                <span>{user?.username || 'User'}!</span>
              </span>
              {/* Tombol Profil Khusus Seluler (Mobile < 768px) di Header */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold font-mono transition-all relative overflow-hidden bg-slate-100 mr-6 ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 ring-2 ring-blue-500 shadow-md'
                      : 'bg-gradient-to-tr from-blue-500 to-sky-400 hover:opacity-90 shadow-md'
                  }`}
                >
                  {profilePic ? (
                    <img src={profilePic} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.username?.slice(0, 2).toUpperCase() || 'U'}</span>
                  )}
                </button>
              </div>
            </h2>
            <p className="text-xs text-slate-500 font-medium">{getGreetingQuote()}</p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Toggle Pasangan Seluler (Mobile/Tablet) */}
            {partnerInfo && (
              <button
                type="button"
                onClick={() => changeDashboardMode(dashboardMode === 'couple' ? 'personal' : 'couple')}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-gradient-to-tr from-blue-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/10 active:scale-95 transition-all"
              >
                <span>🧑‍🤝‍🧑</span>
                <span className="hidden sm:inline">
                  {dashboardMode === 'couple' ? 'Mode Pasangan' : 'Mode Mandiri'}
                </span>
              </button>
            )}

            {/* Kalender widget */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 shadow-sm rounded-xl text-xs text-slate-500 font-semibold">
              <Calendar size={14} className="text-slate-400" />
              <span>{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())}</span>
            </div>

            {/* Tombol Profil Khusus Tablet (768px - 1024px) di sebelah kanan Tanggal */}
            <div className="hidden md:flex lg:hidden items-center">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold font-mono transition-all relative overflow-hidden bg-slate-100 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 ring-2 ring-blue-500 shadow-md'
                    : 'bg-gradient-to-tr from-blue-500 to-sky-400 hover:opacity-90 shadow-md'
                }`}
              >
                {profilePic ? (
                  <img src={profilePic} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.username?.slice(0, 2).toUpperCase() || 'U'}</span>
                )}
                {activeTab === 'profile' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white z-10" />
                )}
              </button>
            </div>

            {/* Catat Transaksi Button (Hanya tampil di Desktop) */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus size={15} className="stroke-[2.5]" />
              Transaksi Baru
            </button>
          </div>
        </header>

        {/* 5. SECTIONS SWITCHER */}
        <div className="mt-6 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">

              {/* 3 Summary Cards */}
              <SummaryCards summary={summary} />

              {/* Quick Action Shortcuts Grid */}
              <QuickActions
                setActiveTab={setActiveTab}
                setIsModalOpen={setIsModalOpen}
                dashboardMode={dashboardMode}
                changeDashboardMode={changeDashboardMode}
                partnerInfo={partnerInfo}
              />

              {/* RATING KESEHATAN FINANSIAL */}
              <section className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in select-none">
                <div className="flex items-start gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-inner shrink-0 mt-0.5">
                    <Heart size={20} className="fill-white/20 stroke-[2]" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:items-center gap-1 sm:gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Skor Kesehatan Finansial:</h4>
                      <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full w-max">
                        {financialHealth?.health_score}/100 — {financialHealth?.rating}
                      </span>
                    </div>
                    {financialHealth?.recommendations?.length > 0 && (
                      <p className="text-[10px] text-slate-500 font-semibold break-words">
                        👉 {financialHealth?.recommendations?.[0]}
                      </p>
                    )}
                  </div>
                </div>
                {/* Panel rekomendasi popup toggle or detail indicator */}
                <div 
                  onClick={() => setIsHealthModalOpen(true)}
                  className="flex items-center justify-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50/50 hover:bg-blue-50 border border-blue-100/30 px-3 py-2 rounded-xl transition-all cursor-pointer w-full sm:w-auto shrink-0 active:scale-[0.98]"
                >
                  <Info size={12} className="stroke-[2.5]" />
                  <span>Detail Analisis</span>
                </div>
              </section>

              {/* Charts Section */}
              <ChartsSection cashflowTrend={cashflowTrend} categoryExpenses={categoryExpenses} transactions={transactions} />

              {/* Grid 2 Column: Budgets & Goals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BudgetsSection
                  budgets={budgets}
                  transactions={transactions}
                  addBudget={addBudget}
                  removeBudget={handleRemoveBudget}
                  categories={categories}
                  budgetForecasts={budgetForecasts}
                />
                <GoalsSection
                  goals={goals}
                  addGoal={addGoal}
                  contributeGoal={contributeGoal}
                  removeGoal={handleRemoveGoal}
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
                  removeTransaction={handleRemoveTransaction}
                  dashboardMode={dashboardMode}
                />
              </div>

            </div>
          )}

          {activeTab === 'ai-chat' && (
            <div className="animate-fade-in">
              <AIChatSection dashboardMode={dashboardMode} />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-fade-in space-y-6">
              {/* SUB TAB SWITCHER */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setTransactionSubTab('history')}
                  className={`px-5 py-3 text-xs font-bold transition-all border-b-2 focus:outline-none ${
                    transactionSubTab === 'history'
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Riwayat Transaksi
                </button>
                <button
                  onClick={() => setTransactionSubTab('recurring')}
                  className={`px-5 py-3 text-xs font-bold transition-all border-b-2 focus:outline-none flex items-center gap-1.5 ${
                    transactionSubTab === 'recurring'
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <RefreshCw size={13} className={transactionSubTab === 'recurring' ? 'animate-spin-slow' : ''} />
                  Transaksi Berulang
                </button>
              </div>

              {/* SUB TAB CONTENT */}
              {transactionSubTab === 'history' ? (
                <div className="animate-fade-in">
                  <TransactionList
                    transactions={transactions}
                    removeTransaction={handleRemoveTransaction}
                    dashboardMode={dashboardMode}
                  />
                </div>
              ) : (
                <div className="animate-fade-in">
                  <RecurringSection
                    recurringTemplates={recurringTemplates}
                    addRecurringTemplate={addRecurringTemplate}
                    toggleRecurringActive={toggleRecurringActive}
                    removeRecurringTemplate={handleRemoveRecurringTemplate}
                    triggerProcessRecurring={triggerProcessRecurring}
                    categories={categories}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="animate-fade-in">
              <BudgetsSection
                budgets={budgets}
                transactions={transactions}
                addBudget={addBudget}
                removeBudget={handleRemoveBudget}
                categories={categories}
                budgetForecasts={budgetForecasts}
              />
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="animate-fade-in">
              <CategorySection
                categories={categories}
                addCategory={addCategory}
                editCategory={editCategory}
                removeCategory={removeCategory}
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="animate-fade-in">
              <GoalsSection
                goals={goals}
                addGoal={addGoal}
                contributeGoal={contributeGoal}
                removeGoal={handleRemoveGoal}
              />
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="animate-fade-in">
              <CalculatorSection />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <ProfileSection
                user={user}
                updateUserProfile={updateUserProfile}
                isDemo={isDemo}
                onLogout={logout}
                dashboardMode={dashboardMode}
                changeDashboardMode={changeDashboardMode}
                partnerInfo={partnerInfo}
                incomingInvites={incomingInvites}
                sendCoupleInvite={sendCoupleInvite}
                acceptCoupleInvite={acceptCoupleInvite}
                rejectCoupleInvite={rejectCoupleInvite}
                disconnectCouple={disconnectCouple}
                triggerOnboarding={() => setIsOnboardingOpen(true)}
              />
            </div>
          )}
        </div>

      </main>
      </div>

      {/* 6. BOTTOM NAVIGATION (MOBILE) */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onAddClick={() => setIsModalOpen(true)} />

      {/* 7. POPUP MODAL TRANSAKSI BARU */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addTransaction={addTransaction}
        categories={categories}
      />

      {/* 8. GLOBAL DELETE CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 max-w-sm w-full relative animate-fade-in">
            {/* Header / Icon */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle size={20} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{confirmModal.title}</h3>
            </div>

            {/* Message */}
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
              {confirmModal.message}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all border border-slate-200/60 text-center focus:outline-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 hover:shadow-rose-500/25 transition-all text-center focus:outline-none animate-pulse-subtle"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. ONBOARDING TUTORIAL MODAL */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        user={user}
      />

      {/* 10. DETAIL KESEHATAN FINANSIAL MODAL */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-[100] flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 max-w-lg w-full relative animate-fade-in flex flex-col max-h-[85vh]">
            <button
              onClick={() => setIsHealthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all focus:outline-none"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <Heart size={24} className="fill-emerald-500/10 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Detail Kesehatan Finansial</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Laporan & Analisis Otomatis</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-5 bg-gradient-to-tr from-slate-50 to-slate-100/50 rounded-2xl border border-slate-100/80 mb-6 shrink-0">
              <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                <span>{financialHealth?.health_score}</span>
                <span className="text-slate-400 text-xs font-semibold">/ 100</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 mt-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                {financialHealth?.rating}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Rekomendasi & Penilaian</h4>
              {financialHealth?.recommendations && financialHealth.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {financialHealth.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 bg-slate-50/50 rounded-xl border border-slate-100/60 hover:bg-slate-50 transition-colors">
                      <span className="text-sm shrink-0">💡</span>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">Belum ada rekomendasi. Catat lebih banyak transaksi untuk mendapatkan penilaian keuangan Anda.</p>
              )}
            </div>

            <button
              onClick={() => setIsHealthModalOpen(false)}
              className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all text-center focus:outline-none"
            >
              Tutup Analisis
            </button>
          </div>
        </div>
      )}

      {/* MODAL 11: KONFIRMASI PEMINDAIAN KODE QR (SENDER FLOW) */}
      {pendingInvite && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[3px] z-[120] flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 max-w-sm w-full relative animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce-subtle">
              💑
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-2">QR Code Terdeteksi!</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
              Anda memindai Kode QR milik <strong className="text-slate-800">{pendingInvite.name}</strong> ({pendingInvite.email}).
              <br/><br/>
              Kirim undangan kemitraan sekarang untuk saling terhubung dan mengelola keuangan bersama?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('pending_invite');
                  setPendingInvite(null);
                }}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all border border-slate-200/60 text-center focus:outline-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetEmail = pendingInvite.email;
                  sessionStorage.removeItem('pending_invite');
                  setPendingInvite(null);
                  const res = await sendCoupleInvite(targetEmail);
                  if (res.success) {
                    alert('Undangan berhasil dikirim! Silakan minta pasangan Anda untuk menerima undangan tersebut di layar mereka.');
                  } else {
                    alert(res.message || 'Gagal mengirimkan undangan.');
                  }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-pink-500 hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-md transition-all text-center focus:outline-none"
              >
                Kirim Undangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 12: POP-UP KONFIRMASI UNDANGAN MASUK (RECIPIENT FLOW) */}
      {incomingInvites && incomingInvites.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[3px] z-[120] flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 max-w-sm w-full relative animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              💖
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-2">Undangan Kemitraan Baru!</h3>
            <p className="text-xs text-slate-550 font-semibold leading-relaxed mb-6">
              <strong className="text-pink-600 font-black">{incomingInvites[0].requester_username}</strong> ({incomingInvites[0].requester_email}) mengundang Anda untuk menghubungkan pos keuangan bersama.
              <br/><br/>
              Apakah Anda setuju untuk menghubungkan akun saat ini ke Mode Pasangan?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  const res = await rejectCoupleInvite(incomingInvites[0].id);
                  if (!res.success) alert(res.message || 'Gagal menolak undangan');
                }}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all border border-slate-200/60 text-center focus:outline-none"
              >
                Tolak
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await acceptCoupleInvite(incomingInvites[0].id);
                  if (!res.success) {
                    alert(res.message || 'Gagal menerima undangan');
                  } else {
                    alert('Kemitraan berhasil terhubung! Selamat mengelola keuangan bersama.');
                  }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-md transition-all text-center focus:outline-none"
              >
                Terima
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
