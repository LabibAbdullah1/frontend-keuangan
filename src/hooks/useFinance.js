import { useState, useEffect, useCallback } from 'react';
import { api, checkDemoMode } from '../services/api';

export const useFinance = () => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [cashflowTrend, setCashflowTrend] = useState([]);
  const [financialHealth, setFinancialHealth] = useState({ health_score: 100, rating: 'Memuat...', recommendations: [] });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  // State Autentikasi
  const [user, setUser] = useState(api.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());

  // Mendengarkan perubahan autentikasi secara global
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(api.getCurrentUser());
      setIsAuthenticated(api.isAuthenticated());
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Fungsi untuk memuat seluruh data dari API secara paralel
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!api.isAuthenticated()) {
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setRecurringTemplates([]);
      setSummary({ total_income: 0, total_expense: 0, balance: 0 });
      setCategoryExpenses([]);
      setCashflowTrend([]);
      setFinancialHealth({ health_score: 100, rating: 'Silakan Login', recommendations: [] });
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    setError(null);
    try {
      // Pastikan access token valid di memori sebelum memanggil data secara paralel.
      // Ini mencegah log konsol dipenuhi pesan merah 401 karena request tanpa token sebelum silent refresh.
      await api.ensureAccessToken();

      const [
        txRes,
        budgetRes,
        goalRes,
        summaryRes,
        categoryRes,
        trendRes,
        healthRes,
        recurringRes
      ] = await Promise.all([
        api.getTransactions(),
        api.getBudgets(),
        api.getGoals(),
        api.getSummary(),
        api.getCategoryExpenses(),
        api.getCashflowTrend(),
        api.getFinancialHealth(),
        api.getRecurringTemplates()
      ]);

      if (txRes.success) setTransactions(txRes.data);
      if (budgetRes.success) setBudgets(budgetRes.data);
      if (goalRes.success) setGoals(goalRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (categoryRes.success) setCategoryExpenses(categoryRes.data);
      if (trendRes.success) setCashflowTrend(trendRes.data);
      if (healthRes.success) setFinancialHealth(healthRes.data);
      if (recurringRes.success) setRecurringTemplates(recurringRes.data);

      setIsDemo(checkDemoMode());
    } catch (err) {
      console.error('Error fetching finance data:', err);
      // Jika error adalah kadaluarsa otentikasi / sesi habis, hapus error di tingkat UI
      if (err.message.includes('Sesi Anda telah berakhir') || err.message.includes('autentikasi tidak lengkap')) {
        setError(null);
      } else {
        setError(err.message || 'Gagal memuat data finansial.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Ambil data awal saat hook dipasang atau status auth berubah
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, isAuthenticated]);

  // Handler Autentikasi
  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      const res = await api.login(emailOrUsername, password);
      return res;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const res = await api.register(username, email, password);
      return res;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await api.logout();
    setLoading(false);
  };

  // Handler CRUD Transaksi
  const addTransaction = async (data) => {
    try {
      const res = await api.createTransaction(data);
      if (res.success) {
        await fetchAllData(true);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Gagal membuat transaksi' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const removeTransaction = async (id) => {
    try {
      const res = await api.deleteTransaction(id);
      if (res.success) {
        await fetchAllData(true);
        return { success: true };
      }
      return { success: false, message: 'Gagal menghapus transaksi' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Handler CRUD Anggaran
  const addBudget = async (data) => {
    try {
      const res = await api.createBudget(data);
      if (res.success) {
        await fetchAllData(true);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Gagal membuat anggaran' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const removeBudget = async (id) => {
    try {
      const res = await api.deleteBudget(id);
      if (res.success) {
        await fetchAllData(true);
        return { success: true };
      }
      return { success: false, message: 'Gagal menghapus anggaran' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Handler CRUD Target Tabungan (Goals)
  const addGoal = async (data) => {
    try {
      const res = await api.createGoal(data);
      if (res.success) {
        await fetchAllData(true);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Gagal membuat target tabungan' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const contributeGoal = async (id, amount) => {
    try {
      const res = await api.contributeToGoal(id, amount);
      if (res.success) {
        await fetchAllData(true);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Gagal menambahkan alokasi dana' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const removeGoal = async (id) => {
    try {
      const res = await api.deleteGoal(id);
      if (res.success) {
        await fetchAllData(true);
        return { success: true };
      }
      return { success: false, message: 'Gagal menghapus target' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Handler CRUD Transaksi Berulang (Recurring Templates)
  const addRecurringTemplate = async (data) => {
    try {
      const res = await api.createRecurringTemplate(data);
      if (res.success) {
        await fetchAllData(true);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Gagal membuat transaksi berulang' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const toggleRecurringActive = async (id, isActive) => {
    try {
      const res = await api.toggleRecurringTemplate(id, isActive);
      if (res.success) {
        await fetchAllData(true);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Gagal mengubah status aktif' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const removeRecurringTemplate = async (id) => {
    try {
      const res = await api.deleteRecurringTemplate(id);
      if (res.success) {
        await fetchAllData(true);
        return { success: true };
      }
      return { success: false, message: 'Gagal menghapus transaksi berulang' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const triggerProcessRecurring = async () => {
    try {
      const res = await api.processRecurringTransactions();
      if (res.success) {
        await fetchAllData(true);
        return { success: true, message: res.message, processed_count: res.processed_count };
      }
      return { success: false, message: 'Gagal memproses transaksi berulang' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    transactions,
    budgets,
    goals,
    recurringTemplates,
    summary,
    categoryExpenses,
    cashflowTrend,
    financialHealth,
    loading,
    error,
    isDemo,
    refreshData: fetchAllData,
    addTransaction,
    removeTransaction,
    addBudget,
    removeBudget,
    addGoal,
    contributeGoal,
    removeGoal,
    addRecurringTemplate,
    toggleRecurringActive,
    removeRecurringTemplate,
    triggerProcessRecurring
  };
};
