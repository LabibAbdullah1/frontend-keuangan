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
      { id: 1, type: 'expense', amount: 150000, category: 'Makanan & Minuman', date: getToday(0), note: 'Makan siang nasi padang bersama tim' },
      { id: 2, type: 'income', amount: 8500000, category: 'Gaji', date: getToday(1), note: 'Transfer gaji bulanan utama' },
      { id: 3, type: 'expense', amount: 450000, category: 'Transportasi', date: getToday(2), note: 'Servis rutin motor dan isi pertamax' },
      { id: 4, type: 'expense', amount: 1200000, category: 'Hiburan & Rekreasi', date: getToday(3), note: 'Beli tiket konser musik akhir pekan' },
      { id: 5, type: 'expense', amount: 800000, category: 'Utilitas & Tagihan', date: getToday(4), note: 'Bayar tagihan listrik dan internet rumah' },
      { id: 6, type: 'income', amount: 1500000, category: 'Investasi', date: getToday(5), note: 'Keuntungan dividen reksa dana saham' },
      { id: 7, type: 'expense', amount: 300000, category: 'Kesehatan', date: getToday(6), note: 'Beli vitamin dan suplemen bulanan' }
    ];
    localStorage.setItem('fe_transactions', JSON.stringify(defaultTransactions));
  }

  if (!localStorage.getItem('fe_budgets')) {
    const defaultBudgets = [
      { id: 1, category: 'Makanan & Minuman', amount: 2000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { id: 2, category: 'Transportasi', amount: 1000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { id: 3, category: 'Hiburan & Rekreasi', amount: 1500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { id: 4, category: 'Utilitas & Tagihan', amount: 1200000, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
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
      { id: 1, type: 'expense', amount: 500000, category: 'Utilitas & Tagihan', frequency: 'monthly', note: 'Bayar Wifi Rumah Indihome', next_due_date: getToday(0), is_active: true, created_at: new Date().toISOString() },
      { id: 2, type: 'income', amount: 8500000, category: 'Gaji', frequency: 'monthly', note: 'Gaji Bulanan Utama', next_due_date: getToday(5), is_active: true, created_at: new Date().toISOString() }
    ];
    localStorage.setItem('fe_recurring', JSON.stringify(defaultRecurring));
  }

  if (!localStorage.getItem('fe_categories')) {
    const defaultCategories = [
      // Income
      { id: 1, user_id: null, type: 'income', name: 'Gaji' },
      { id: 2, user_id: null, type: 'income', name: 'Bonus' },
      { id: 3, user_id: null, type: 'income', name: 'Investasi' },
      { id: 4, user_id: null, type: 'income', name: 'Deposito' },
      { id: 5, user_id: null, type: 'income', name: 'Hibah/Hadiah' },
      { id: 6, user_id: null, type: 'income', name: 'Penjualan' },
      { id: 7, user_id: null, type: 'income', name: 'Lain-lain' },
      // Expense
      { id: 8, user_id: null, type: 'expense', name: 'Makanan & Minuman' },
      { id: 9, user_id: null, type: 'expense', name: 'Belanja Harian' },
      { id: 10, user_id: null, type: 'expense', name: 'Transportasi' },
      { id: 11, user_id: null, type: 'expense', name: 'Utilitas & Tagihan' },
      { id: 12, user_id: null, type: 'expense', name: 'Sewa Rumah & Kos' },
      { id: 13, user_id: null, type: 'expense', name: 'Kesehatan' },
      { id: 14, user_id: null, type: 'expense', name: 'Pendidikan' },
      { id: 15, user_id: null, type: 'expense', name: 'Hiburan & Rekreasi' },
      { id: 16, user_id: null, type: 'expense', name: 'Liburan' },
      { id: 17, user_id: null, type: 'expense', name: 'Pajak & Asuransi' },
      { id: 18, user_id: null, type: 'expense', name: 'Amal & Donasi' },
      { id: 19, user_id: null, type: 'expense', name: 'Lain-lain' }
    ];
    localStorage.setItem('fe_categories', JSON.stringify(defaultCategories));
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
  getCategories: () => JSON.parse(localStorage.getItem('fe_categories') || '[]'),
  saveCategories: (cats) => localStorage.setItem('fe_categories', JSON.stringify(cats)),
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
    if (options.skipMock) {
      throw networkError;
    }
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
            if (options.skipMock) {
              throw networkError;
            }
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
  const jsonResult = await response.json();

  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET' && jsonResult && jsonResult.success && jsonResult.data) {
    const cleanPath = path.split('?')[0];
    if (cleanPath === '/transactions') {
      localStorage.setItem('fe_transactions', JSON.stringify(jsonResult.data));
    } else if (cleanPath === '/budgets') {
      localStorage.setItem('fe_budgets', JSON.stringify(jsonResult.data));
    } else if (cleanPath === '/goals') {
      localStorage.setItem('fe_goals', JSON.stringify(jsonResult.data));
    } else if (cleanPath === '/recurring') {
      localStorage.setItem('fe_recurring', JSON.stringify(jsonResult.data));
    } else if (cleanPath === '/categories') {
      localStorage.setItem('fe_categories', JSON.stringify(jsonResult.data));
    } else if (cleanPath === '/partnership/active') {
      localStorage.setItem('fe_partnership', JSON.stringify(jsonResult.data));
    } else if (cleanPath === '/partnership/invites') {
      localStorage.setItem('fe_partnership_invites', JSON.stringify(jsonResult.data));
    }
  }

  return jsonResult;
};

// Helper untuk mengantrekan aksi mutasi ketika offline
const enqueueOfflineAction = (method, path, body, tempId = null) => {
  const queue = JSON.parse(localStorage.getItem('fe_sync_queue') || '[]');
  // Pastikan kita tidak menduplikasi aksi yang identik dalam waktu yang sama
  queue.push({
    id: Date.now() + Math.random(), // tambahkan random minor agar ID unik jika dipanggil cepat
    method,
    path,
    body,
    tempId
  });
  localStorage.setItem('fe_sync_queue', JSON.stringify(queue));
  console.log(`[Offline Queue] Action queued: ${method} ${path}`, { body, tempId });
};

// Helper parsing lokal luring untuk sinkronisasi/simulasi offline
function simulateOfflineParsing(text, categoriesList) {
  const textLower = text.toLowerCase();
  
  let amount = 0;
  const numberMatches = textLower.match(/\d+[\d\.]*/g);
  if (numberMatches) {
    const rawNumberStr = numberMatches.reduce((a, b) => a.length > b.length ? a : b);
    const parsedNum = parseFloat(rawNumberStr.replace(/\./g, ''));
    if (!isNaN(parsedNum)) {
      amount = parsedNum;
    }
  }

  if (textLower.includes('rb') || textLower.includes('ribu')) {
    if (amount < 1000) amount = amount * 1000;
  }
  if (textLower.includes('jt') || textLower.includes('juta')) {
    if (amount < 1000000) amount = amount * 1000000;
  }

  let type = 'expense';
  if (textLower.includes('gaji') || textLower.includes('masuk') || textLower.includes('bonus') || textLower.includes('pemasukan') || textLower.includes('terima')) {
    type = 'income';
  }

  let note = text;
  note = note.replace(/\b\d+[\d\.]*(?:rb|ribu|jt|juta)?\b/gi, '').trim();
  note = note.replace(/\b(?:habis|bayar|beli|masuk|dapat|sebesar|nominal|rp)\b/gi, '').trim();
  if (!note) note = text;

  let category = 'Lain-lain';
  const categoryNames = categoriesList.filter(c => c.type === type).map(c => c.name);
  
  for (const cat of categoryNames) {
    const catWords = cat.toLowerCase().split(/[ &\/]/);
    for (const word of catWords) {
      if (word.length > 3 && textLower.includes(word)) {
        category = cat;
        break;
      }
    }
    if (category !== 'Lain-lain') break;
  }

  return {
    type,
    amount,
    category,
    date: new Date().toISOString().split('T')[0],
    note: note.slice(0, 50)
  };
}

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
      enqueueOfflineAction('POST', '/transactions', body, newTx.id);
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
        enqueueOfflineAction('DELETE', `/transactions/${idToDelete}`, null);
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
      enqueueOfflineAction('POST', '/budgets', body, newBudget.id);
      return { success: true, data: newBudget };
    }

    if (method === 'DELETE') {
      const match = path.match(/\/budgets\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const originalBudgets = mockDB.getBudgets();
        const updated = originalBudgets.filter(b => b.id !== idToDelete);
        mockDB.saveBudgets(updated);
        enqueueOfflineAction('DELETE', `/budgets/${idToDelete}`, null);
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
      enqueueOfflineAction('POST', '/goals', body, newGoal.id);
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
          enqueueOfflineAction('PUT', `/goals/${idToUpdate}`, body);
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
        enqueueOfflineAction('POST', `/goals/${idToContribute}/contribute`, body);
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
        enqueueOfflineAction('DELETE', `/goals/${idToDelete}`, null);
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
      enqueueOfflineAction('POST', '/recurring', body, newRec.id);
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
        enqueueOfflineAction(options.method || 'PATCH', `/recurring/${idToToggle}/toggle`, body);
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
        enqueueOfflineAction('DELETE', `/recurring/${idToDelete}`, null);
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

    enqueueOfflineAction('POST', '/cron/process-recurring', null);

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

  if (path.startsWith('/analysis/budgets')) {
    const txs = getMockTxs();
    const budgets = mockDB.getBudgets();
    const today = new Date();
    const urlObj = new URL(path, 'http://localhost');
    const month = urlObj.searchParams.get('month') ? parseInt(urlObj.searchParams.get('month'), 10) : today.getMonth() + 1;
    const year = urlObj.searchParams.get('year') ? parseInt(urlObj.searchParams.get('year'), 10) : today.getFullYear();

    const isCurrentMonth = (month === today.getMonth() + 1 && year === today.getFullYear());
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const daysPassed = isCurrentMonth ? today.getDate() : totalDaysInMonth;

    const projections = budgets.map(budget => {
      const totalSpent = txs
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === (month - 1) && d.getFullYear() === year;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const remainingBudget = budget.amount - totalSpent;
      const percentageSpent = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;
      const dailyBurnRate = daysPassed > 0 ? totalSpent / daysPassed : 0;
      const projectedSpending = isCurrentMonth ? dailyBurnRate * totalDaysInMonth : totalSpent;
      const isOverspent = totalSpent > budget.amount;
      const willOverspend = projectedSpending > budget.amount;

      let status = 'ON_TRACK';
      let estimatedExhaustionDay = null;

      if (isOverspent) {
        status = 'OVERSPENT';
      } else if (willOverspend) {
        status = 'HIGH_RISK';
        if (dailyBurnRate > 0) {
          estimatedExhaustionDay = Math.min(
            totalDaysInMonth,
            Math.max(1, Math.floor(budget.amount / dailyBurnRate))
          );
        }
      }

      return {
        id: budget.id,
        category: budget.category,
        budget_limit: budget.amount,
        total_spent: totalSpent,
        remaining_budget: Math.max(0, remainingBudget),
        percentage_spent: parseFloat(percentageSpent.toFixed(2)),
        daily_burn_rate: parseFloat(dailyBurnRate.toFixed(2)),
        projected_spending: parseFloat(projectedSpending.toFixed(2)),
        status,
        estimated_exhaustion_day: estimatedExhaustionDay,
        is_current_month: isCurrentMonth
      };
    });

    return {
      success: true,
      data: {
        month,
        year,
        days_passed: daysPassed,
        total_days: totalDaysInMonth,
        projections
      }
    };
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

  if (path.startsWith('/analysis/ai-chat')) {
    if (method === 'POST') {
      const msgLower = body.message.toLowerCase();
      let reply = 'Halo! Saya KeuanganKu AI. Sepertinya aplikasi sedang berjalan luring dalam mode Demo/Offline, namun saya bisa menyimulasikan saran keuangan untuk Anda.';
      
      if (msgLower.includes('hemat') || msgLower.includes('tips')) {
        reply = 'Tips Hemat KeuanganKu:\n1. Terapkan metode anggaran 50/30/20 (50% kebutuhan pokok, 30% keinginan, 20% tabungan).\n2. Catat semua pengeluaran kecil (seperti parkir/kopi) karena bocor halus seringkali berasal dari hal kecil.\n3. Masak sendiri di rumah dan batasi makan di luar maksimal 2 kali seminggu.\n4. Sebelum membeli barang impulsif, tunggu 24 jam untuk berpikir apakah barang itu benar-benar dibutuhkan.';
      } else if (msgLower.includes('darurat') || msgLower.includes('emergency')) {
        reply = 'Dana darurat sangat penting! Disarankan memiliki dana darurat minimal sebesar 3-6 kali pengeluaran bulanan Anda jika Anda lajang, dan 6-12 kali jika Anda sudah berkeluarga atau memiliki tanggungan. Simpanlah di instrumen likuid dan aman seperti Reksadana Pasar Uang atau rekening tabungan terpisah.';
      } else if (msgLower.includes('investasi') || msgLower.includes('saham') || msgLower.includes('reksa')) {
        reply = 'Untuk investasi, prinsip utamanya adalah: pahami risikonya sebelum menaruh uang Anda. Bagi pemula, mulailah dengan instrumen berisiko rendah seperti Reksadana Pasar Uang atau Obligasi Negara. Jika profil risiko Anda moderat/agresif, Anda bisa mulai mempelajari reksadana saham, emas, atau saham blue-chip.';
      } else if (msgLower.includes('analisis') || msgLower.includes('kondisi') || msgLower.includes('saldo')) {
        reply = 'Berdasarkan data simulasi luring, saldo dan anggaran Anda masih terpantau seimbang. Pastikan Anda disiplin mengalokasikan tabungan di awal bulan!';
      }

      return {
        success: true,
        data: {
          message: reply + '\n\n*(Catatan: Ini adalah tanggapan simulasi luring)*'
        }
      };
    }
  }

  if (path.startsWith('/analysis/ai-parse-transaction')) {
    if (method === 'POST') {
      const categories = mockDB.getCategories();
      const mockResult = simulateOfflineParsing(body.text, categories);
      return { success: true, data: mockResult };
    }
  }

  if (path.startsWith('/analysis/ai-scan-receipt')) {
    if (method === 'POST') {
      const categories = mockDB.getCategories();
      const randomAmount = Math.floor(Math.random() * (150000 - 35000 + 1)) + 35000;
      
      const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
      let category = 'Belanja Harian';
      if (expenseCategories.length > 0) {
        if (expenseCategories.includes('Belanja Harian')) {
          category = 'Belanja Harian';
        } else if (expenseCategories.includes('Makanan & Minuman')) {
          category = 'Makanan & Minuman';
        } else {
          category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        }
      }

      return {
        success: true,
        data: {
          type: 'expense',
          amount: randomAmount,
          category,
          date: new Date().toISOString().split('T')[0],
          note: `Struk Belanja Toko Harian (Simulasi Offline)`
        }
      };
    }
  }

  if (path.startsWith('/analysis/ai-forecast')) {
    const randomIncome = Math.floor(Math.random() * (9500000 - 8000000 + 1)) + 8000000;
    const randomExpense = Math.floor(Math.random() * (7500000 - 5000000 + 1)) + 5000000;
    const riskLevel = randomIncome - randomExpense < 500000 ? 'MEDIUM' : 'LOW';
    
    return {
      success: true,
      data: {
        predicted_income: randomIncome,
        predicted_expense: randomExpense,
        risk_level: riskLevel,
        warnings: [
          'Bulan depan, pengeluaran kategori Makanan & Minuman diproyeksikan stabil namun ada risiko bocor halus.',
          'Sisihkan dana darurat ekstra minimal Rp500.000 untuk mengantisipasi pengeluaran tak terduga.'
        ],
        analysis_text: 'Analisis luring mode demo menunjukkan cash flow Anda berada pada level risiko aman, pertahankan pola menabung di awal bulan.'
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

      enqueueOfflineAction('PUT', '/users/profile', body);

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

        enqueueOfflineAction('POST', '/partnership/invite', body);

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

        enqueueOfflineAction('PUT', `/partnership/accept/${inviteId}`, null);

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

        enqueueOfflineAction('PUT', `/partnership/reject/${inviteId}`, null);

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

        enqueueOfflineAction('DELETE', '/partnership/disconnect', null);

        return {
          success: true,
          message: 'Hubungan kemitraan berhasil diputuskan. Anda kembali ke mode mandiri.'
        };
      }
    }
  }

  // 9. RUTE KALKULATOR
  if (path.startsWith('/calculators/budget-allocation')) {
    if (method === 'POST') {
      const needs = parseFloat((body.monthly_income * 0.50).toFixed(2));
      const wants = parseFloat((body.monthly_income * 0.30).toFixed(2));
      const savings = parseFloat((body.monthly_income * 0.20).toFixed(2));
      return {
        success: true,
        data: {
          monthly_income: body.monthly_income,
          allocations: {
            needs: { percentage: 50, amount: needs, description: 'Kebutuhan Pokok (Sewa rumah/kos, tagihan air/listrik, belanja dapur harian, transportasi, dan cicilan utang wajib).' },
            wants: { percentage: 30, amount: wants, description: 'Keinginan Pribadi (Makan di luar/kafe, hiburan/streaming, hobi, belanja baju, dan liburan).' },
            savings: { percentage: 20, amount: savings, description: 'Tabungan & Investasi (Dana darurat, investasi reksadana/emas/saham, tabungan berjangka, dan pelunasan utang ekstra).' }
          },
          tips: [
            'Prioritaskan pemotongan porsi Tabungan (20%) secara otomatis begitu Anda menerima gaji (Auto-debet/Pay yourself first).',
            'Gunakan porsi 50% Kebutuhan Pokok untuk menjaga kebutuhan dasar hidup Anda tetap memenuhi kebutuhan primer.',
            'Jika alokasi Keinginan (30%) bersisa di akhir bulan, alihkan sisanya langsung ke rekening Tabungan atau Dana Darurat.'
          ]
        }
      };
    }
  }

  if (path.startsWith('/calculators/savings-simulator')) {
    if (method === 'POST') {
      const { target_amount, current_amount = 0, duration_months, monthly_contribution, annual_interest_rate = 0 } = body;
      const monthlyInterestRate = (annual_interest_rate / 12) / 100;
      const remainingTarget = target_amount - current_amount;

      if (remainingTarget <= 0) {
        return {
          success: true,
          data: {
            target_amount, current_amount, duration_months: 0, monthly_contribution: 0, annual_interest_rate,
            total_interest_earned: 0, total_principal: current_amount, total_accumulated: current_amount,
            projection_schedule: []
          }
        };
      }

      let calculatedMonthlyContribution = monthly_contribution || 0;
      let calculatedDuration = duration_months || 0;

      if (duration_months && !monthly_contribution) {
        if (monthlyInterestRate === 0) {
          calculatedMonthlyContribution = remainingTarget / duration_months;
        } else {
          const fvCurrent = current_amount * Math.pow(1 + monthlyInterestRate, duration_months);
          if (fvCurrent >= target_amount) {
            calculatedMonthlyContribution = 0;
          } else {
            const remainingFv = target_amount - fvCurrent;
            const annuityFactor = (Math.pow(1 + monthlyInterestRate, duration_months) - 1) / monthlyInterestRate;
            calculatedMonthlyContribution = remainingFv / annuityFactor;
          }
        }
        calculatedMonthlyContribution = parseFloat(calculatedMonthlyContribution.toFixed(2));
      }

      let currentBalance = current_amount;
      let totalInterest = 0;
      let totalPrincipal = current_amount;
      let month = 0;
      const pmt = calculatedMonthlyContribution;
      const maxMonths = duration_months || 600;
      let schedule = [];

      while (currentBalance < target_amount && month < maxMonths) {
        month++;
        const interest = currentBalance * monthlyInterestRate;
        totalInterest += interest;
        totalPrincipal += pmt;
        currentBalance = currentBalance + interest + pmt;

        if (month <= 120) {
          schedule.push({
            month,
            principal_saved: parseFloat(totalPrincipal.toFixed(2)),
            interest_earned: parseFloat(totalInterest.toFixed(2)),
            balance: parseFloat(currentBalance.toFixed(2))
          });
        }
      }

      return {
        success: true,
        data: {
          target_amount: parseFloat(target_amount.toFixed(2)),
          current_amount: parseFloat(current_amount.toFixed(2)),
          duration_months: duration_months || month,
          monthly_contribution: calculatedMonthlyContribution,
          annual_interest_rate,
          total_interest_earned: parseFloat(totalInterest.toFixed(2)),
          total_principal: parseFloat(totalPrincipal.toFixed(2)),
          total_accumulated: parseFloat(currentBalance.toFixed(2)),
          projection_schedule: schedule
        }
      };
    }
  }

  if (path.startsWith('/calculators/emergency-fund')) {
    if (method === 'POST') {
      const { monthly_expense, marital_status = 'single', dependents_count = 0, include_partner = false } = body;
      
      let finalMonthlyExpense = monthly_expense;
      let source = 'manual_input';

      if (!finalMonthlyExpense) {
        const txs = getMockTxs();
        const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        finalMonthlyExpense = parseFloat((expense / 3).toFixed(2)) || 2500000;
        source = 'database_average_90_days';
      }

      let multiplier = marital_status === 'married' ? 9 : 6;
      multiplier += dependents_count;
      if (multiplier > 12) multiplier = 12;

      const targetEmergencyFund = parseFloat((finalMonthlyExpense * multiplier).toFixed(2));
      let currentSavings = 0;
      let emergencyGoalName = null;

      const goals = mockDB.getGoals();
      const emergencyGoal = goals.find(g =>
        g.name.toLowerCase().includes('darurat') ||
        g.name.toLowerCase().includes('emergency')
      );

      if (emergencyGoal) {
        currentSavings = emergencyGoal.current_amount;
        emergencyGoalName = emergencyGoal.name;
      }

      const remainingToTarget = Math.max(0, targetEmergencyFund - currentSavings);
      const progressPercentage = targetEmergencyFund > 0
        ? parseFloat(((currentSavings / targetEmergencyFund) * 100).toFixed(2))
        : 0;

      return {
        success: true,
        data: {
          calculated_monthly_expense: finalMonthlyExpense,
          source, marital_status, dependents_count, multiplier,
          target_emergency_fund: targetEmergencyFund,
          current_savings: currentSavings,
          emergency_goal_name: emergencyGoalName,
          remaining_to_target: parseFloat(remainingToTarget.toFixed(2)),
          progress_percentage: progressPercentage,
          partner_included: hasActivePartner && include_partner,
          recommendations: [
            `Berdasarkan status Anda, disarankan memiliki dana darurat sebesar ${multiplier} kali pengeluaran bulanan.`,
            `Dana darurat sebaiknya disimpan di tempat yang sangat likuid dan bebas risiko (seperti tabungan bank konvensional atau Reksadana Pasar Uang).`,
            `Fokus mengumpulkan dana darurat ini terlebih dahulu sebelum Anda melakukan investasi agresif di instrumen berisiko tinggi.`
          ]
        }
      };
    }
  }

  if (path.startsWith('/calculators/debt-payoff')) {
    if (method === 'POST') {
      const { debts, extra_monthly_payment = 0 } = body;

      const simulate = (strategyType) => {
        let debtsListCopy = debts.map(d => ({
          name: d.name,
          balance: d.balance,
          interest_rate: d.interest_rate,
          minimum_payment: d.minimum_payment,
          total_paid: 0,
          total_interest: 0
        }));

        let months = 0;
        let totalInterestPaid = 0;
        let payoffOrder = [];
        let timeline = [];

        while (debtsListCopy.some(d => d.balance > 0) && months < 360) {
          months++;
          let activeDebts = debtsListCopy.filter(d => d.balance > 0);

          if (strategyType === 'snowball') {
            activeDebts.sort((a, b) => a.balance - b.balance);
          } else {
            activeDebts.sort((a, b) => b.interest_rate - a.interest_rate);
          }

          for (let d of debtsListCopy) {
            if (d.balance > 0) {
              const monthlyInterest = d.balance * (d.interest_rate / 100 / 12);
              d.balance += monthlyInterest;
              d.total_interest += monthlyInterest;
              totalInterestPaid += monthlyInterest;
            }
          }

          const sumActiveMinimums = activeDebts.reduce((sum, d) => sum + d.minimum_payment, 0);
          let availableBudget = sumActiveMinimums + extra_monthly_payment;
          let paymentsThisMonth = {};

          for (let d of activeDebts) {
            const payment = Math.min(d.balance, d.minimum_payment);
            d.balance -= payment;
            d.total_paid += payment;
            availableBudget -= payment;
            paymentsThisMonth[d.name] = payment;

            if (d.balance === 0 && !payoffOrder.includes(d.name)) {
              payoffOrder.push(d.name);
            }
          }

          if (availableBudget > 0) {
            for (let d of activeDebts) {
              if (d.balance > 0) {
                const extraPay = Math.min(d.balance, availableBudget);
                d.balance -= extraPay;
                d.total_paid += extraPay;
                availableBudget -= extraPay;
                paymentsThisMonth[d.name] = (paymentsThisMonth[d.name] || 0) + extraPay;

                if (d.balance === 0 && !payoffOrder.includes(d.name)) {
                  payoffOrder.push(d.name);
                }
                if (availableBudget <= 0) break;
              }
            }
          }

          const monthlyTotalPaid = Object.values(paymentsThisMonth).reduce((a, b) => a + b, 0);
          if (months <= 60) {
            timeline.push({
              month: months,
              remaining_debts: debtsListCopy.map(d => ({ name: d.name, balance: parseFloat(d.balance.toFixed(2)) })),
              amount_paid: parseFloat(monthlyTotalPaid.toFixed(2))
            });
          }
        }

        return {
          strategy: strategyType,
          months_to_payoff: months,
          total_interest_paid: parseFloat(totalInterestPaid.toFixed(2)),
          payoff_order: payoffOrder,
          timeline
        };
      };

      const snowballResult = simulate('snowball');
      const avalancheResult = simulate('avalanche');

      const interestSaved = parseFloat((snowballResult.total_interest_paid - avalancheResult.total_interest_paid).toFixed(2));
      const monthsSaved = snowballResult.months_to_payoff - avalancheResult.months_to_payoff;

      let recommendation = 'Metode Debt Avalanche direkomendasikan karena menghemat biaya bunga paling banyak.';
      if (interestSaved === 0) {
        recommendation = 'Kedua metode menghasilkan biaya bunga yang sama. Metode Debt Snowball direkomendasikan untuk motivasi psikologis yang lebih cepat.';
      }

      return {
        success: true,
        data: {
          extra_monthly_payment,
          strategies: {
            snowball: snowballResult,
            avalanche: avalancheResult
          },
          comparison: {
            interest_saved_by_avalanche: Math.max(0, interestSaved),
            months_saved_by_avalanche: Math.max(0, monthsSaved),
            recommendation
          }
        }
      };
    }
  }

  // 10. RUTE KATEGORI (CATEGORIES)
  if (path.startsWith('/categories')) {
    let categories = mockDB.getCategories();

    if (method === 'GET') {
      const urlObj = new URL(path, 'http://localhost');
      const typeParam = urlObj.searchParams.get('type');
      let result = categories;
      if (typeParam) {
        result = categories.filter(c => c.type === typeParam);
      }
      return { success: true, data: result };
    }

    if (method === 'POST') {
      const name = body.name.trim();
      const type = body.type;

      // Cek apakah ada kategori dengan nama & tipe yang sama (case-insensitive)
      const duplicate = categories.some(c => c.type === type && c.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        return { success: false, message: `Kategori "${name}" untuk tipe "${type}" sudah terdaftar.` };
      }

      const newCategory = {
        id: Date.now(),
        user_id: _user?.id || 1,
        type,
        name
      };

      categories.push(newCategory);
      mockDB.saveCategories(categories);
      enqueueOfflineAction('POST', '/categories', body, newCategory.id);
      return { success: true, data: newCategory };
    }

    if (method === 'PUT') {
      const match = path.match(/\/categories\/(\d+)/);
      if (match) {
        const idToUpdate = parseInt(match[1]);
        const newName = body.name.trim();
        
        const catIndex = categories.findIndex(c => c.id === idToUpdate && c.user_id !== null);
        if (catIndex === -1) {
          return { success: false, message: 'Kategori tidak ditemukan atau merupakan kategori bawaan.' };
        }

        const category = categories[catIndex];
        const oldName = category.name;
        const type = category.type;

        // Cek duplikasi nama baru
        const duplicate = categories.some(c => c.id !== idToUpdate && c.type === type && c.name.toLowerCase() === newName.toLowerCase());
        if (duplicate) {
          return { success: false, message: `Kategori "${newName}" untuk tipe "${type}" sudah terdaftar.` };
        }

        // Update kategori
        categories[catIndex].name = newName;
        mockDB.saveCategories(categories);

        // Cascade rename to transactions
        const txs = mockDB.getTransactions();
        txs.forEach(t => {
          if (t.category === oldName && t.type === type) {
            t.category = newName;
          }
        });
        mockDB.saveTransactions(txs);

        // Cascade rename to budgets
        if (type === 'expense') {
          const budgets = mockDB.getBudgets();
          budgets.forEach(b => {
            if (b.category === oldName) {
              b.category = newName;
            }
          });
          mockDB.saveBudgets(budgets);
        }

        // Cascade rename to recurring templates
        const recurring = mockDB.getRecurring();
        recurring.forEach(r => {
          if (r.category === oldName && r.type === type) {
            r.category = newName;
          }
        });
        mockDB.saveRecurring(recurring);

        enqueueOfflineAction('PUT', `/categories/${idToUpdate}`, body);

        return {
          success: true,
          data: {
            id: idToUpdate,
            user_id: _user?.id || 1,
            type,
            old_name: oldName,
            new_name: newName
          }
        };
      }
    }

    if (method === 'DELETE') {
      const match = path.match(/\/categories\/(\d+)/);
      if (match) {
        const idToDelete = parseInt(match[1]);
        const catIndex = categories.findIndex(c => c.id === idToDelete && c.user_id !== null);
        if (catIndex === -1) {
          return { success: false, message: 'Kategori tidak ditemukan atau merupakan kategori bawaan.' };
        }

        const category = categories[catIndex];
        const oldName = category.name;
        const type = category.type;

        // Hapus kategori
        categories.splice(catIndex, 1);
        mockDB.saveCategories(categories);

        // Cascade delete to 'Lain-lain' in transactions
        const txs = mockDB.getTransactions();
        txs.forEach(t => {
          if (t.category === oldName && t.type === type) {
            t.category = 'Lain-lain';
          }
        });
        mockDB.saveTransactions(txs);

        // Cascade delete to 'Lain-lain' in budgets
        if (type === 'expense') {
          const budgets = mockDB.getBudgets();
          budgets.forEach(b => {
            if (b.category === oldName) {
              b.category = 'Lain-lain';
            }
          });
          mockDB.saveBudgets(budgets);
        }

        // Cascade delete to 'Lain-lain' in recurring templates
        const recurring = mockDB.getRecurring();
        recurring.forEach(r => {
          if (r.category === oldName && r.type === type) {
            r.category = 'Lain-lain';
          }
        });
        mockDB.saveRecurring(recurring);

        enqueueOfflineAction('DELETE', `/categories/${idToDelete}`, null);

        return { success: true, message: 'Kategori kustom berhasil dihapus.' };
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

  // Kategori (Categories)
  getCategories: (type) => request(`/categories${type ? `?type=${type}` : ''}`),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, name) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

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
  getBudgetForecasts: (month, year, mode) => {
    const q = [];
    if (month) q.push(`month=${month}`);
    if (year) q.push(`year=${year}`);
    if (mode) q.push(`mode=${mode}`);
    const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
    return request(`/analysis/budgets${queryStr}`);
  },
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
  chatWithAI: (message, history, mode) => request(`/analysis/ai-chat${mode ? `?mode=${mode}` : ''}`, {
    method: 'POST',
    body: JSON.stringify({ message, history })
  }),

  parseTransactionText: (text) => request('/analysis/ai-parse-transaction', {
    method: 'POST',
    body: JSON.stringify({ text })
  }),

  scanReceipt: (image, mimeType) => request('/analysis/ai-scan-receipt', {
    method: 'POST',
    body: JSON.stringify({ image, mimeType })
  }),

  getFinancialForecast: (mode) => request(`/analysis/ai-forecast${mode ? `?mode=${mode}` : ''}`),

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
  disconnect: () => request('/partnership/disconnect', { method: 'DELETE' }),

  // Kalkulator Keuangan
  getBudgetAllocation: (monthly_income) => request('/calculators/budget-allocation', { method: 'POST', body: JSON.stringify({ monthly_income }) }),
  getSavingsProjection: (data) => request('/calculators/savings-simulator', { method: 'POST', body: JSON.stringify(data) }),
  getEmergencyFundRecommendation: (data) => request('/calculators/emergency-fund', { method: 'POST', body: JSON.stringify(data) }),
  getDebtPayoffStrategy: (data) => request('/calculators/debt-payoff', { method: 'POST', body: JSON.stringify(data) }),

  // Memproses antrean sinkronisasi ketika online kembali
  syncOfflineData: async () => {
    if (!navigator.onLine) return { success: false, message: 'Tidak ada koneksi internet' };
    
    let queue = JSON.parse(localStorage.getItem('fe_sync_queue') || '[]');
    if (queue.length === 0) return { success: true, message: 'Antrean sinkronisasi kosong' };

    console.log(`[Sync] Memulai sinkronisasi ${queue.length} item...`);
    
    const idMap = JSON.parse(localStorage.getItem('fe_sync_id_map') || '{}');
    
    // Ambil data lokal untuk melakukan pembaruan ID lokal
    let transactions = JSON.parse(localStorage.getItem('fe_transactions') || '[]');
    let budgets = JSON.parse(localStorage.getItem('fe_budgets') || '[]');
    let goals = JSON.parse(localStorage.getItem('fe_goals') || '[]');
    let recurring = JSON.parse(localStorage.getItem('fe_recurring') || '[]');
    let categories = JSON.parse(localStorage.getItem('fe_categories') || '[]');

    let processedCount = 0;
    
    // Menggunakan perulangan for...of agar proses sinkronisasi FIFO sinkron (berurutan)
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      
      // 1. Resolve path dengan mengganti tempId -> realId
      let resolvedPath = item.path;
      Object.entries(idMap).forEach(([tempId, realId]) => {
        resolvedPath = resolvedPath.replace(new RegExp(`/${tempId}\\b`, 'g'), `/${realId}`);
      });

      // 2. Resolve body jika ada tempId
      let resolvedBody = item.body;
      if (item.body) {
        let bodyStr = JSON.stringify(item.body);
        Object.entries(idMap).forEach(([tempId, realId]) => {
          bodyStr = bodyStr.replace(new RegExp(`\\b${tempId}\\b`, 'g'), realId);
        });
        resolvedBody = JSON.parse(bodyStr);
      }

      try {
        console.log(`[Sync] Mengirim: ${item.method} ${resolvedPath}`, resolvedBody);
        
        const response = await request(resolvedPath, {
          method: item.method,
          body: resolvedBody ? JSON.stringify(resolvedBody) : undefined,
          skipMock: true // Paksa request gagal jika koneksi putus
        });

        processedCount++;

        // Jika operasi adalah POST (Pembuatan Baru) dan mengembalikan data dengan ID server
        if (item.method === 'POST' && item.tempId && response && response.success && response.data) {
          const serverId = response.data.id;
          const tempId = item.tempId;
          idMap[tempId] = serverId;

          // Cari tipe model dari path
          if (item.path.startsWith('/transactions')) {
            transactions = transactions.map(t => t.id === tempId ? { ...t, id: serverId } : t);
          } else if (item.path.startsWith('/budgets')) {
            budgets = budgets.map(b => b.id === tempId ? { ...b, id: serverId } : b);
          } else if (item.path.startsWith('/goals')) {
            goals = goals.map(g => g.id === tempId ? { ...g, id: serverId } : g);
          } else if (item.path.startsWith('/recurring')) {
            recurring = recurring.map(r => r.id === tempId ? { ...r, id: serverId } : r);
          } else if (item.path.startsWith('/categories')) {
            categories = categories.map(c => c.id === tempId ? { ...c, id: serverId } : c);
          }
        }
        
        // Update antrean luring setelah berhasil mengirim satu item
        const updatedQueue = queue.slice(processedCount);
        localStorage.setItem('fe_sync_queue', JSON.stringify(updatedQueue));
        localStorage.setItem('fe_sync_id_map', JSON.stringify(idMap));

        // Simpan data lokal yang ID-nya sudah dipetakan
        localStorage.setItem('fe_transactions', JSON.stringify(transactions));
        localStorage.setItem('fe_budgets', JSON.stringify(budgets));
        localStorage.setItem('fe_goals', JSON.stringify(goals));
        localStorage.setItem('fe_recurring', JSON.stringify(recurring));
        localStorage.setItem('fe_categories', JSON.stringify(categories));

      } catch (error) {
        console.error(`[Sync Failed] Gagal memproses ${item.method} ${resolvedPath}:`, error.message);
        
        // Jika errornya karena masalah koneksi jaringan (TypeError: Failed to fetch)
        // Kita batalkan perulangan sync agar item sisa dicoba lagi nanti saat koneksi stabil
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('network') || error.message.includes('HTTP error! status: 504') || error.message.includes('HTTP error! status: 503'))) {
          throw new Error('Koneksi terputus saat sinkronisasi. Sisa data akan disinkronkan nanti.');
        }
        
        // Jika error validasi atau data rusak dari client (400 Bad Request, dll.),
        // kita lewati item tersebut agar antrean tidak macet selamanya
        console.warn(`[Sync Skipped] Melewati aksi yang rusak karena error API permanen.`);
        const updatedQueue = queue.slice(processedCount);
        localStorage.setItem('fe_sync_queue', JSON.stringify(updatedQueue));
      }
    }

    // Bersihkan ID Map setelah selesai sinkronisasi seluruhnya
    localStorage.removeItem('fe_sync_id_map');
    console.log(`[Sync] Selesai! Berhasil menyinkronkan ${processedCount} aksi.`);
    return { success: true, processedCount };
  }
};
