// Service Layer untuk mengelola interaksi API dengan Backend cPanel/Lokal.
// Menyediakan fitur "Resilient Demo Mode" berbasis LocalStorage jika koneksi API gagal,
// Serta mendukung otentikasi JWT (Access Token & Refresh Token) dengan interseptor auto-refresh.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// State Autentikasi dalam memori
let _refreshToken = localStorage.getItem('refreshToken');
let _user = JSON.parse(localStorage.getItem('user') || 'null');
let _accessToken = null; // Access token disimpan di memori demi keamanan (XSS protection)

// Database Mock lokal untuk menjaga fungsionalitas UI 100% luring (Offline/Demo Mode)
const initMockDB = () => {
  const getToday = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // 1. RUTE TRANSAKSI
  if (path.startsWith('/transactions')) {
    const txs = mockDB.getTransactions();

    if (method === 'GET') {
      const match = path.match(/\/transactions\/(\d+)/);
      if (match) {
        const tx = txs.find(t => t.id === parseInt(match[1]));
        return { success: true, data: tx || null };
      }
      return { success: true, data: txs };
    }

    if (method === 'POST') {
      const newTx = {
        id: Date.now(),
        type: body.type,
        amount: parseFloat(body.amount),
        category: body.category,
        date: body.date,
        note: body.note || ''
      };
      txs.unshift(newTx);
      mockDB.saveTransactions(txs);
      return { success: true, data: newTx };
    }

    if (method === 'DELETE') {
      const match = path.match(/\/transactions\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const updated = txs.filter(t => t.id !== idToDelete);
        mockDB.saveTransactions(updated);
        return { success: true, message: 'Transaksi berhasil dihapus' };
      }
    }
  }

  // 2. RUTE ANGGARAN (BUDGETS)
  if (path.startsWith('/budgets')) {
    const budgets = mockDB.getBudgets();

    if (method === 'GET') {
      return { success: true, data: budgets };
    }

    if (method === 'POST') {
      const newBudget = {
        id: Date.now(),
        category: body.category,
        amount: parseFloat(body.amount),
        month: parseInt(body.month),
        year: parseInt(body.year)
      };
      budgets.push(newBudget);
      mockDB.saveBudgets(budgets);
      return { success: true, data: newBudget };
    }

    if (method === 'DELETE') {
      const match = path.match(/\/budgets\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const updated = budgets.filter(b => b.id !== idToDelete);
        mockDB.saveBudgets(updated);
        return { success: true, message: 'Anggaran berhasil dihapus' };
      }
    }
  }

  // 3. RUTE TARGET TABUNGAN (GOALS)
  if (path.startsWith('/goals')) {
    const goals = mockDB.getGoals();

    if (method === 'GET') {
      const match = path.match(/\/goals\/(\d+)/);
      if (match) {
        const goal = goals.find(g => g.id === parseInt(match[1]));
        return { success: true, data: goal || null };
      }
      return { success: true, data: goals };
    }

    if (method === 'POST') {
      const newGoal = {
        id: Date.now(),
        name: body.name,
        target_amount: parseFloat(body.target_amount),
        current_amount: parseFloat(body.current_amount || 0),
        target_date: body.target_date
      };
      goals.push(newGoal);
      mockDB.saveGoals(goals);
      return { success: true, data: newGoal };
    }

    if (method === 'PUT') {
      const match = path.match(/\/goals\/(\d+)/);
      if (match) {
        const idToUpdate = parseInt(match[1]);
        const index = goals.findIndex(g => g.id === idToUpdate);
        if (index !== -1) {
          goals[index] = { ...goals[index], ...body };
          mockDB.saveGoals(goals);
          return { success: true, data: goals[index] };
        }
      }
    }

    // Alokasi kontribusi dana tabungan
    if (path.match(/\/goals\/(\d+)\/contribute/)) {
      const match = path.match(/\/goals\/(\d+)\/contribute/);
      const idToContribute = parseInt(match[1]);
      const index = goals.findIndex(g => g.id === idToContribute);
      if (index !== -1) {
        goals[index].current_amount += parseFloat(body.amount);
        mockDB.saveGoals(goals);
        return { success: true, data: goals[index] };
      }
    }

    if (method === 'DELETE') {
      const match = path.match(/\/goals\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const updated = goals.filter(g => g.id !== idToDelete);
        mockDB.saveGoals(updated);
        return { success: true, message: 'Target tabungan berhasil dihapus' };
      }
    }
  }

  // 5. RUTE TRANSAKSI BERULANG (RECURRING)
  if (path.startsWith('/recurring')) {
    const recurring = mockDB.getRecurring();

    if (method === 'GET') {
      return { success: true, data: recurring };
    }

    if (method === 'POST') {
      const newRec = {
        id: Date.now(),
        type: body.type,
        amount: parseFloat(body.amount),
        category: body.category,
        frequency: body.frequency,
        note: body.note || '',
        next_due_date: body.next_due_date,
        is_active: true,
        created_at: new Date().toISOString()
      };
      recurring.push(newRec);
      mockDB.saveRecurring(recurring);
      return { success: true, message: 'Templat transaksi berulang berhasil didaftarkan.', data: newRec };
    }

    if (path.match(/\/recurring\/(\d+)\/toggle/)) {
      const match = path.match(/\/recurring\/(\d+)\/toggle/);
      const idToToggle = parseInt(match[1]);
      const index = recurring.findIndex(r => r.id === idToToggle);
      if (index !== -1) {
        recurring[index].is_active = body.is_active;
        mockDB.saveRecurring(recurring);
        return { success: true, message: 'Status berhasil diubah.', data: recurring[index] };
      }
    }

    if (method === 'DELETE') {
      const match = path.match(/\/recurring\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const updated = recurring.filter(r => r.id !== idToDelete);
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
          note: `[Otomatis Berulang] ${rec.note || ''}`.trim()
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
    const txs = mockDB.getTransactions();
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
    const txs = mockDB.getTransactions();
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
    const txs = mockDB.getTransactions();
    
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
    const txs = mockDB.getTransactions();
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
  getTransactions: () => request('/transactions'),
  getTransaction: (id) => request(`/transactions/${id}`),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Anggaran
  getBudgets: () => request('/budgets'),
  createBudget: (data) => request('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request('/goals'),
  getGoal: (id) => request(`/goals/${id}`),
  createGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  contributeToGoal: (id, amount) => request(`/goals/${id}/contribute`, { method: 'POST', body: JSON.stringify({ amount }) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Analisis
  getSummary: () => request('/analysis/summary'),
  getCategoryExpenses: () => request('/analysis/category'),
  getCashflowTrend: () => request('/analysis/cashflow-trend'),
  getFinancialHealth: async () => {
    const res = await request('/analysis/health');
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
  getRecurringTemplates: () => request('/recurring'),
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
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) })
};
