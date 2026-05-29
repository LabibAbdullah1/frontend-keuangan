// Service Layer untuk mengelola interaksi API dengan Backend cPanel/Lokal.
// Menyediakan fitur "Resilient Demo Mode" berbasis LocalStorage jika koneksi API gagal,
// Serta mendukung otentikasi JWT (Access Token & Refresh Token) dengan interseptor auto-refresh.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// State Autentikasi dalam memori
let _refreshToken = localStorage.getItem('refreshToken');
let _user = JSON.parse(localStorage.getItem('user') || 'null');
let _accessToken = null; // Access token disimpan di memori demi keamanan (XSS protection)

// Helper date untuk data mock luring di modul scope
const getToday = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Database Mock lokal untuk menjaga fungsionalitas UI 100% luring (Offline/Demo Mode)
const initMockDB = () => {
  if (!localStorage.getItem('fe_transactions')) {
    const defaultTransactions = [
      { id: 1, type: 'expense', amount: 150000, category: 'Makanan', date: getToday(0), note: 'Makan siang nasi padang bersama tim' },
      { id: 2, type: 'income', amount: 8500000, category: 'Gaji', date: getToday(1), note: 'Transfer gaji bulanan utama' },
      { id: 3, type: 'expense', amount: 450000, category: 'Transportasi', date: getToday(2), note: 'Servis rutin motor dan isi pertamax' },
      { id: 4, type: 'expense', amount: 1200000, category: 'Hiburan', date: getToday(3), note: 'Beli tiket konser musik akhir pekan' },
      { id: 5, type: 'expense', amount: 800000, category: 'Tagihan', date: getToday(4), note: 'Bayar tagihan listrik dan internet rumah' },
      { id: 6, type: 'income', amount: 1500000, category: 'Investasi', date: getToday(5), note: 'Keuntungan dividen reksa dana saham' },
      { id: 7, type: 'expense', amount: 300000, category: 'Kesehatan', date: getToday(6), note: 'Beli vitamin dan suplemen bulanan' }
    ];
    localStorage.setItem('fe_transactions', JSON.stringify(defaultTransactions));
  }

  if (!localStorage.getItem('fe_budgets')) {
    const defaultBudgets = [
      { id: 1, category: 'Makanan', amount: 2000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { id: 2, category: 'Transportasi', amount: 1000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { id: 3, category: 'Hiburan', amount: 1500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { id: 4, category: 'Tagihan', amount: 1200000, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
    ];
    localStorage.setItem('fe_budgets', JSON.stringify(defaultBudgets));
  }

  if (!localStorage.getItem('fe_goals')) {
    const defaultGoals = [
      { id: 1, name: 'Beli Laptop MacBook M3', target_amount: 22000000, current_amount: 14500000, target_date: '2026-10-31' },
      { id: 2, name: 'Liburan ke Jepang', target_amount: 18000000, current_amount: 6000000, target_date: '2027-04-30' }
    ];
    localStorage.setItem('fe_goals', JSON.stringify(defaultGoals));
  }

  if (!localStorage.getItem('fe_recurring')) {
    const defaultRecurring = [
      { id: 1, type: 'expense', amount: 500000, category: 'Tagihan', frequency: 'monthly', note: 'Bayar Wifi Rumah Indihome', next_due_date: getToday(0), is_active: true, created_at: new Date().toISOString() },
      { id: 2, type: 'income', amount: 8500000, category: 'Gaji', frequency: 'monthly', note: 'Gaji Bulanan Utama', next_due_date: getToday(5), is_active: true, created_at: new Date().toISOString() }
    ];
    localStorage.setItem('fe_recurring', JSON.stringify(defaultRecurring));
  }

  if (localStorage.getItem('fe_partnership') === null) {
    localStorage.setItem('fe_partnership', 'null');
  }

  if (!localStorage.getItem('fe_partnership_invites')) {
    const defaultInvites = [
      { id: 45, requester_id: 999, requester_username: 'Sayang 💖', requester_email: 'sayang@keuangan.com', created_at: new Date().toISOString() }
    ];
    localStorage.setItem('fe_partnership_invites', JSON.stringify(defaultInvites));
  }
};

initMockDB();

// Pembantu CRUD Mock Database
const mockDB = {
  getTransactions: () => JSON.parse(localStorage.getItem('fe_transactions') || '[]'),
  saveTransactions: (txs) => localStorage.setItem('fe_transactions', JSON.stringify(txs)),
  getBudgets: () => JSON.parse(localStorage.getItem('fe_budgets') || '[]'),
  saveBudgets: (bds) => localStorage.setItem('fe_budgets', JSON.stringify(bds)),
  getGoals: () => JSON.parse(localStorage.getItem('fe_goals') || '[]'),
  saveGoals: (gls) => localStorage.setItem('fe_goals', JSON.stringify(gls)),
  getRecurring: () => JSON.parse(localStorage.getItem('fe_recurring') || '[]'),
  saveRecurring: (rcs) => localStorage.setItem('fe_recurring', JSON.stringify(rcs)),
  getPartnership: () => JSON.parse(localStorage.getItem('fe_partnership') || 'null'),
  savePartnership: (p) => localStorage.setItem('fe_partnership', JSON.stringify(p)),
  getPartnershipInvites: () => JSON.parse(localStorage.getItem('fe_partnership_invites') || '[]'),
  savePartnershipInvites: (pIs) => localStorage.setItem('fe_partnership_invites', JSON.stringify(pIs)),
};

// Detektor status API (digunakan untuk memicu banner mode demo di UI)
let isDemoMode = false;
export const checkDemoMode = () => isDemoMode;

// Fungsi pembantu fetch yang resilient
const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Sematkan JWT Access Token jika tersedia di memori
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Hanya tangkap kesalahan koneksi jaringan (TypeError: Failed to fetch / server luring)
    console.warn(`[API Connection Failed] Route: ${path}. Mengalihkan ke Resilient Demo Mode.`, networkError.message);
    isDemoMode = true;
    return handleMockRequest(path, options);
  }

  // ==============================================================
  // INTERSEPTOR: AUTO REFRESH TOKEN (Saat Access Token Kadaluarsa / 401)
  // ==============================================================
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/refresh') {
    console.warn('[JWT Access Token Expired] Mencoba melakukan penyegaran token otomatis (silent refresh)...');
    
    if (_refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: _refreshToken })
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          _accessToken = refreshData.accessToken;
          console.log('[JWT Refresh Success] Access Token baru berhasil didapatkan secara senyap.');

          // Ulangi request asli dengan Access Token yang baru
          headers['Authorization'] = `Bearer ${_accessToken}`;
          try {
            response = await fetch(`${API_BASE_URL}${path}`, {
              ...options,
              headers,
            });
          } catch (networkError) {
            console.warn(`[API Connection Failed] Route: ${path} (setelah refresh). Mengalihkan ke Resilient Demo Mode.`, networkError.message);
            isDemoMode = true;
            return handleMockRequest(path, options);
          }
        } else {
          console.error('[JWT Refresh Failed] Refresh Token tidak valid/kadaluarsa. Mengeluarkan user.');
          api.logout();
          throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.');
        }
      } catch (refreshErr) {
        api.logout();
        throw refreshErr;
      }
    } else {
      throw new Error('Koneksi terproteksi ditolak. Autentikasi tidak lengkap.');
    }
  }

  // Jika response dari API tidak OK (misal: 400 Bad Request untuk validasi, 500 internal error)
  // Lemparkan error agar ditangani oleh UI, BUKAN dialihkan ke Demo Mode.
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  isDemoMode = false;
  return await response.json();
};

// Menangani request dalam mode demo (Mock)
const handleMockRequest = (path, options = {}) => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;

  const isCoupleMode = path.includes('mode=couple');
  const activePartner = JSON.parse(localStorage.getItem('fe_partnership') || 'null');
  const hasActivePartner = activePartner && activePartner.status === 'accepted';
  const partnerName = hasActivePartner ? activePartner.partner_username : 'Pasangan';

  // Helper to obtain transactions dynamically based on couple mode status
  const getMockTxs = () => {
    let txs = mockDB.getTransactions().map(t => ({
      ...t,
      creator_name: t.creator_name || _user?.username || 'Saya'
    }));

    if (isCoupleMode && hasActivePartner) {
      const partnerTxs = [
        { id: 'p1', type: 'expense', amount: 80000, category: 'Makanan', date: getToday(0), note: 'Beli kopi & croissant sore hari', creator_name: partnerName, created_at: new Date().toISOString() },
        { id: 'p2', type: 'expense', amount: 250000, category: 'Hiburan', date: getToday(2), note: 'Nonton bioskop premiere berdua', creator_name: partnerName, created_at: new Date().toISOString() },
        { id: 'p3', type: 'income', amount: 4500000, category: 'Gaji', date: getToday(1), note: 'Gaji Bulanan Pasangan', creator_name: partnerName, created_at: new Date().toISOString() }
      ];
      txs = [...txs, ...partnerTxs];
      // Sort by date DESC, id DESC
      txs.sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
    }
    return txs;
  };

  // 1. RUTE TRANSAKSI
  if (path.startsWith('/transactions')) {
    let txs = getMockTxs();

    if (method === 'GET') {
      const match = path.match(/\/transactions\/(\d+)/);
      if (match) {
        const tx = txs.find(t => t.id === parseInt(match[1]) || t.id === match[1]);
        return { success: true, data: tx || null };
      }
      return { success: true, data: txs };
    }

    if (method === 'POST') {
      const originalTxs = mockDB.getTransactions();
      const newTx = {
        id: Date.now(),
        type: body.type,
        amount: parseFloat(body.amount),
        category: body.category,
        date: body.date,
        note: body.note || '',
        creator_name: _user?.username || 'Saya'
      };
      originalTxs.unshift(newTx);
      mockDB.saveTransactions(originalTxs);
      return { success: true, data: newTx };
    }

    if (method === 'DELETE') {
      const match = path.match(/\/transactions\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        // Cari dan hapus di database luring original (jika milik partner, biarkan untuk simulasi)
        const originalTxs = mockDB.getTransactions();
        const updated = originalTxs.filter(t => t.id !== idToDelete);
        mockDB.saveTransactions(updated);
        return { success: true, message: 'Transaksi berhasil dihapus' };
      }
    }
  }

  // 2. RUTE ANGGARAN (BUDGETS)
  if (path.startsWith('/budgets')) {
    let budgets = mockDB.getBudgets();

    if (isCoupleMode && hasActivePartner) {
      const partnerBudgets = [
        { id: 'pb1', category: 'Makanan', amount: 1500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { id: 'pb2', category: 'Transportasi', amount: 500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
      ];
      // Gabungkan berdasarkan kategori
      const combined = {};
      [...budgets, ...partnerBudgets].forEach(b => {
        if (combined[b.category]) {
          combined[b.category].amount += b.amount;
        } else {
          combined[b.category] = { ...b };
        }
      });
      budgets = Object.values(combined);
    }

    if (method === 'GET') {
      return { success: true, data: budgets };
    }

    if (method === 'POST') {
      const originalBudgets = mockDB.getBudgets();
      const newBudget = {
        id: Date.now(),
        category: body.category,
        amount: parseFloat(body.amount),
        month: parseInt(body.month),
        year: parseInt(body.year)
      };
      originalBudgets.push(newBudget);
      mockDB.saveBudgets(originalBudgets);
      return { success: true, data: newBudget };
    }

    if (method === 'DELETE') {
      const match = path.match(/\/budgets\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const originalBudgets = mockDB.getBudgets();
        const updated = originalBudgets.filter(b => b.id !== idToDelete);
        mockDB.saveBudgets(updated);
        return { success: true, message: 'Anggaran berhasil dihapus' };
      }
    }
  }

  // 3. RUTE TARGET TABUNGAN (GOALS)
  if (path.startsWith('/goals')) {
    let goals = mockDB.getGoals().map(g => ({
      ...g,
      creator_name: g.creator_name || _user?.username || 'Saya'
    }));

    if (isCoupleMode && hasActivePartner) {
      const partnerGoals = [
        { id: 'pg1', name: 'Tabungan Nikah 💍', target_amount: 50000000, current_amount: 15000000, target_date: '2027-06-30', creator_name: partnerName },
        { id: 'pg2', name: 'Beli Motor Listrik ⚡', target_amount: 25000000, current_amount: 8000000, target_date: '2026-12-31', creator_name: partnerName }
      ];
      goals = [...goals, ...partnerGoals];
    }

    if (method === 'GET') {
      const match = path.match(/\/goals\/(\d+)/);
      if (match) {
        const goal = goals.find(g => g.id === parseInt(match[1]) || g.id === match[1]);
        return { success: true, data: goal || null };
      }
      return { success: true, data: goals };
    }

    if (method === 'POST') {
      const originalGoals = mockDB.getGoals();
      const newGoal = {
        id: Date.now(),
        name: body.name,
        target_amount: parseFloat(body.target_amount),
        current_amount: parseFloat(body.current_amount || 0),
        target_date: body.target_date,
        creator_name: _user?.username || 'Saya'
      };
      originalGoals.push(newGoal);
      mockDB.saveGoals(originalGoals);
      return { success: true, data: newGoal };
    }

    if (method === 'PUT') {
      const match = path.match(/\/goals\/(\d+)/);
      if (match) {
        const idToUpdate = parseInt(match[1]);
        const originalGoals = mockDB.getGoals();
        const index = originalGoals.findIndex(g => g.id === idToUpdate);
        if (index !== -1) {
          originalGoals[index] = { ...originalGoals[index], ...body };
          mockDB.saveGoals(originalGoals);
          return { success: true, data: originalGoals[index] };
        }
      }
    }

    // Alokasi kontribusi dana tabungan
    if (path.match(/\/goals\/(\d+)\/contribute/)) {
      const match = path.match(/\/goals\/(\d+)\/contribute/);
      const idToContribute = parseInt(match[1]);
      const originalGoals = mockDB.getGoals();
      const index = originalGoals.findIndex(g => g.id === idToContribute);
      if (index !== -1) {
        originalGoals[index].current_amount += parseFloat(body.amount);
        mockDB.saveGoals(originalGoals);
        return { success: true, data: originalGoals[index] };
      }
    }

    if (method === 'DELETE') {
      const match = path.match(/\/goals\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const originalGoals = mockDB.getGoals();
        const updated = originalGoals.filter(g => g.id !== idToDelete);
        mockDB.saveGoals(updated);
        return { success: true, message: 'Target tabungan berhasil dihapus' };
      }
    }
  }

  // 5. RUTE TRANSAKSI BERULANG (RECURRING)
  if (path.startsWith('/recurring')) {
    let recurring = mockDB.getRecurring().map(r => ({
      ...r,
      creator_name: r.creator_name || _user?.username || 'Saya'
    }));

    if (isCoupleMode && hasActivePartner) {
      const partnerRecurring = [
        { id: 'pr1', type: 'expense', amount: 150000, category: 'Hiburan', frequency: 'monthly', note: 'Netflix Premium Pasangan', next_due_date: getToday(0), is_active: true, created_at: new Date().toISOString(), creator_name: partnerName }
      ];
      recurring = [...recurring, ...partnerRecurring];
    }

    if (method === 'GET') {
      return { success: true, data: recurring };
    }

    if (method === 'POST') {
      const originalRecurring = mockDB.getRecurring();
      const newRec = {
        id: Date.now(),
        type: body.type,
        amount: parseFloat(body.amount),
        category: body.category,
        frequency: body.frequency,
        note: body.note || '',
        next_due_date: body.next_due_date,
        is_active: true,
        created_at: new Date().toISOString(),
        creator_name: _user?.username || 'Saya'
      };
      originalRecurring.push(newRec);
      mockDB.saveRecurring(originalRecurring);
      return { success: true, message: 'Templat transaksi berulang berhasil didaftarkan.', data: newRec };
    }

    if (path.match(/\/recurring\/(\d+)\/toggle/)) {
      const match = path.match(/\/recurring\/(\d+)\/toggle/);
      const idToToggle = parseInt(match[1]);
      const originalRecurring = mockDB.getRecurring();
      const index = originalRecurring.findIndex(r => r.id === idToToggle);
      if (index !== -1) {
        originalRecurring[index].is_active = body.is_active;
        mockDB.saveRecurring(originalRecurring);
        return { success: true, message: 'Status berhasil diubah.', data: originalRecurring[index] };
      }
    }

    if (method === 'DELETE') {
      const match = path.match(/\/recurring\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const originalRecurring = mockDB.getRecurring();
        const updated = originalRecurring.filter(r => r.id !== idToDelete);
        mockDB.saveRecurring(updated);
        return { success: true, message: 'Templat berhasil dihapus' };
      }
    }
  }

  // 6. CRON PROCESS RECURRING
  if (path.startsWith('/cron/process-recurring')) {
    const recurring = mockDB.getRecurring();
    const txs = mockDB.getTransactions();
    const todayStr = getToday(0);
    let processedCount = 0;

    const updatedRecurring = recurring.map(rec => {
      if (!rec.is_active) return rec;

      let nextDue = new Date(rec.next_due_date);
      const today = new Date(todayStr);

      if (nextDue <= today) {
        const newTx = {
          id: Date.now() + processedCount,
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          date: rec.next_due_date,
          note: `[Otomatis Berulang] ${rec.note || ''}`.trim(),
          creator_name: _user?.username || 'Saya'
        };
        txs.unshift(newTx);
        processedCount++;

        if (rec.frequency === 'daily') {
          nextDue.setDate(nextDue.getDate() + 1);
        } else if (rec.frequency === 'weekly') {
          nextDue.setDate(nextDue.getDate() + 7);
        } else if (rec.frequency === 'monthly') {
          nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (rec.frequency === 'yearly') {
          nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
      }

      const nextDueStr = `${nextDue.getFullYear()}-${String(nextDue.getMonth() + 1).padStart(2, '0')}-${String(nextDue.getDate()).padStart(2, '0')}`;
      return {
        ...rec,
        next_due_date: nextDueStr
      };
    });

    if (processedCount > 0) {
      mockDB.saveRecurring(updatedRecurring);
      mockDB.saveTransactions(txs);
    }

    return {
      success: true,
      processed_count: processedCount,
      message: `${processedCount} transaksi berulang berhasil diproses secara lokal.`
    };
  }

  // 4. RUTE ANALISIS & AGREGASI
  if (path.startsWith('/analysis/summary')) {
    const txs = getMockTxs();
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      success: true,
      data: {
        total_income: income,
        total_expense: expense,
        balance: income - expense
      }
    };
  }

  if (path.startsWith('/analysis/category')) {
    const txs = getMockTxs();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const categoryMap = {};
    txs.forEach(t => {
      const tDate = new Date(t.date);
      if (t.type === 'expense' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }
    });

    const categoryData = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      total_amount: amount
    })).sort((a, b) => b.total_amount - a.total_amount);

    return { success: true, data: categoryData };
  }

  if (path.startsWith('/analysis/cashflow-trend')) {
    const txs = getMockTxs();

    // Kelompokkan berdasarkan bulan
    const monthlyMap = {};
    txs.forEach(t => {
      const monthStr = t.date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') monthlyMap[monthStr].income += t.amount;
      if (t.type === 'expense') monthlyMap[monthStr].expense += t.amount;
    });

    // Urutkan dan format
    const trendData = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net_cashflow: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Ambil maks 6 bulan terakhir

    return { success: true, data: trendData };
  }

  if (path.startsWith('/analysis/health')) {
    const txs = getMockTxs();
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    let score = 50;
    let rating = 'Cukup';
    let recommendations = [];

    if (savingRate >= 30) {
      score = 85;
      rating = 'Sangat Sehat';
      recommendations.push('Hebat! Tingkat tabungan Anda di atas 30%. Keuangan Anda sangat aman.');
    } else if (savingRate >= 10) {
      score = 70;
      rating = 'Sehat';
      recommendations.push('Bagus, Anda menabung secara konsisten. Coba kurangi pengeluaran non-primer untuk meningkatkan porsi tabungan.');
    } else {
      score = 45;
      rating = 'Butuh Perhatian';
      recommendations.push('Waspada, pengeluaran Anda hampir menyamai atau melebihi pemasukan. Mulai budgeting ketat!');
    }

    const budgets = mockDB.getBudgets();
    let overspentCategories = [];
    budgets.forEach(b => {
      const spent = txs
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent > b.amount) {
        overspentCategories.push(b.category);
      }
    });

    if (overspentCategories.length > 0) {
      score -= 10;
      recommendations.push(`Pengeluaran di kategori [${overspentCategories.join(', ')}] telah melebihi batas anggaran bulanan Anda.`);
    } else {
      recommendations.push('Bagus! Semua pos pengeluaran Anda masih berada di bawah batas anggaran bulanan.');
    }

    return {
      success: true,
      data: {
        health_score: Math.max(0, Math.min(100, score)),
        rating,
        recommendations
      }
    };
  }

  // 7. RUTE PROFIL USER (USER PROFILE)
  if (path.startsWith('/users/profile')) {
    if (method === 'PUT') {
      const updatedUser = {
        ..._user,
        username: body.username,
        email: body.email
      };
      _user = updatedUser;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Dispatch event agar App.jsx tahu ada perubahan
      window.dispatchEvent(new Event('auth-change'));

      return {
        success: true,
        message: 'Profil Anda berhasil diperbarui (Mode Demo).',
        data: {
          user: updatedUser,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      };
    }
  }

  // 8. RUTE KEMITRAAN (PARTNERSHIPS)
  if (path.startsWith('/partnership')) {
    const partnership = mockDB.getPartnership();
    const invites = mockDB.getPartnershipInvites();

    if (path.startsWith('/partnership/active')) {
      if (method === 'GET') {
        return { success: true, data: partnership };
      }
    }

    if (path.startsWith('/partnership/invites')) {
      if (method === 'GET') {
        return { success: true, data: invites };
      }
    }

    if (path.startsWith('/partnership/invite')) {
      if (method === 'POST') {
        const { partnerIdentifier } = body;
        if (!partnerIdentifier || !partnerIdentifier.trim()) {
          return { success: false, message: 'Username atau Email pasangan tidak boleh kosong.' };
        }

        const ident = partnerIdentifier.trim().toLowerCase();
        if (ident === _user?.username?.toLowerCase() || ident === _user?.email?.toLowerCase()) {
          return { success: false, message: 'Anda tidak dapat mengirimkan undangan kemitraan kepada diri sendiri.' };
        }

        const inviteeName = partnerIdentifier.split('@')[0];

        return {
          success: true,
          message: `Undangan kemitraan berhasil dikirim ke '${inviteeName}'.`,
          data: { id: Date.now(), requester_id: _user.id, receiver_id: 888, status: 'pending' }
        };
      }
    }

    if (path.startsWith('/partnership/accept')) {
      if (method === 'PUT') {
        const match = path.match(/\/partnership\/accept\/(\d+)/);
        const inviteId = match ? parseInt(match[1]) : null;

        const updatedInvites = invites.filter(inv => inv.id !== inviteId);
        mockDB.savePartnershipInvites(updatedInvites);

        const newPartner = {
          partnership_id: inviteId || Date.now(),
          partner_id: 999,
          partner_username: 'Sayang 💖',
          partner_email: 'sayang@keuangan.com',
          status: 'accepted'
        };
        mockDB.savePartnership(newPartner);

        return {
          success: true,
          message: 'Selamat! Anda kini telah terhubung sebagai pasangan. Dashboard gabungan siap digunakan.'
        };
      }
    }

    if (path.startsWith('/partnership/reject')) {
      if (method === 'PUT') {
        const match = path.match(/\/partnership\/reject\/(\d+)/);
        const inviteId = match ? parseInt(match[1]) : null;

        const updatedInvites = invites.filter(inv => inv.id !== inviteId);
        mockDB.savePartnershipInvites(updatedInvites);

        return {
          success: true,
          message: 'Undangan kemitraan berhasil ditolak.'
        };
      }
    }

    if (path.startsWith('/partnership/disconnect')) {
      if (method === 'DELETE') {
        mockDB.savePartnership(null);
        // Reset invites to default so user can test the accept flow again
        const defaultInvites = [
          { id: 45, requester_id: 999, requester_username: 'Sayang 💖', requester_email: 'sayang@keuangan.com', created_at: new Date().toISOString() }
        ];
        mockDB.savePartnershipInvites(defaultInvites);

        return {
          success: true,
          message: 'Hubungan kemitraan berhasil diputuskan. Anda kembali ke mode mandiri.'
        };
      }
    }
  }

  return { success: false, message: `Rute mock '${path}' tidak ditemukan.` };
};

// Ekspor modul client API
export const api = {
  // Autentikasi
  register: (username, email, password) => 
    request('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify({ username, email, password }) 
    }),

  login: async (emailOrUsername, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password })
    });

    const res = await response.json();
    
    if (response.ok && res.success) {
      _accessToken = res.data.accessToken;
      _refreshToken = res.data.refreshToken;
      _user = res.data.user;

      localStorage.setItem('refreshToken', _refreshToken);
      localStorage.setItem('user', JSON.stringify(_user));
      
      // Dispatch event agar App.jsx tahu ada perubahan login
      window.dispatchEvent(new Event('auth-change'));
      return res;
    } else {
      throw new Error(res.message || 'Gagal masuk. Periksa kembali username/email & password.');
    }
  },

  logout: async () => {
    try {
      if (_accessToken && _refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${_accessToken}`
          },
          body: JSON.stringify({ refreshToken: _refreshToken })
        }).catch(() => {});
      }
    } finally {
      // Hapus data autentikasi lokal
      _accessToken = null;
      _refreshToken = null;
      _user = null;
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      window.dispatchEvent(new Event('auth-change'));
    }
  },

  getCurrentUser: () => _user,
  getAccessToken: () => _accessToken,
  isAuthenticated: () => !!_refreshToken,

  setSession: (user, accessToken, refreshToken) => {
    _user = user;
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', refreshToken);
    window.dispatchEvent(new Event('auth-change'));
  },

  ensureAccessToken: async () => {
    if (_accessToken) return _accessToken;
    if (!_refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: _refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        _accessToken = data.accessToken;
        return _accessToken;
      } else {
        // Jika token gagal disegarkan (misal: refresh token kedaluwarsa), bersihkan sesi
        _accessToken = null;
        _refreshToken = null;
        _user = null;
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
        return null;
      }
    } catch (err) {
      return null;
    }
  },

  // Transaksi
  getTransactions: (mode) => request(`/transactions${mode ? `?mode=${mode}` : ''}`),
  getTransaction: (id, mode) => request(`/transactions/${id}${mode ? `?mode=${mode}` : ''}`),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id, mode) => request(`/transactions/${id}${mode ? `?mode=${mode}` : ''}`, { method: 'DELETE' }),

  // Anggaran
  getBudgets: (mode) => request(`/budgets${mode ? `?mode=${mode}` : ''}`),
  createBudget: (data) => request('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: (mode) => request(`/goals${mode ? `?mode=${mode}` : ''}`),
  getGoal: (id, mode) => request(`/goals/${id}${mode ? `?mode=${mode}` : ''}`),
  createGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, data, mode) => request(`/goals/${id}${mode ? `?mode=${mode}` : ''}`, { method: 'PUT', body: JSON.stringify(data) }),
  contributeToGoal: (id, amount, mode) => request(`/goals/${id}/contribute${mode ? `?mode=${mode}` : ''}`, { method: 'POST', body: JSON.stringify({ amount }) }),
  deleteGoal: (id, mode) => request(`/goals/${id}${mode ? `?mode=${mode}` : ''}`, { method: 'DELETE' }),

  // Analisis
  getSummary: (mode) => request(`/analysis/summary${mode ? `?mode=${mode}` : ''}`),
  getCategoryExpenses: (mode) => request(`/analysis/category${mode ? `?mode=${mode}` : ''}`),
  getCashflowTrend: (mode) => request(`/analysis/cashflow-trend${mode ? `?mode=${mode}` : ''}`),
  getFinancialHealth: async (mode) => {
    const res = await request(`/analysis/health${mode ? `?mode=${mode}` : ''}`);
    if (res.success && res.data && res.data.financial_health_score !== undefined) {
      res.data = {
        health_score: res.data.financial_health_score,
        rating: res.data.grade,
        recommendations: res.data.assessments || []
      };
    }
    return res;
  },

  // Transaksi Berulang (Recurring)
  getRecurringTemplates: (mode) => request(`/recurring${mode ? `?mode=${mode}` : ''}`),
  createRecurringTemplate: (data) => request('/recurring', { method: 'POST', body: JSON.stringify(data) }),
  toggleRecurringTemplate: (id, is_active) => request(`/recurring/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  deleteRecurringTemplate: (id) => request(`/recurring/${id}`, { method: 'DELETE' }),
  processRecurringTransactions: () => 
    request('/cron/process-recurring', { 
      method: 'POST',
      headers: {
        'X-CRON-KEY': import.meta.env.VITE_CRON_SECURE_KEY || ''
      }
    }),

  // Profil User
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Rute Kemitraan (Partnerships)
  invite: (partnerIdentifier) => 
    request('/partnership/invite', { 
      method: 'POST', 
      body: JSON.stringify({ partnerIdentifier }) 
    }),
  getInvites: () => request('/partnership/invites'),
  acceptInvite: (id) => request(`/partnership/accept/${id}`, { method: 'PUT' }),
  rejectInvite: (id) => request(`/partnership/reject/${id}`, { method: 'PUT' }),
  getActivePartner: () => request('/partnership/active'),
  disconnect: () => request('/partnership/disconnect', { method: 'DELETE' })
};
