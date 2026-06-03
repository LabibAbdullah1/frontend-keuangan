import React, { useState, useEffect } from 'react';
import { api, checkDemoMode } from '../../services/api';
import { formatRupiah } from '../../utils/format';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Calculator,
  Percent,
  TrendingUp,
  ShieldAlert,
  Flame,
  Plus,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Calendar,
  DollarSign,
  Heart,
  Users
} from 'lucide-react';

export default function CalculatorSection() {
  const [activeCalcTab, setActiveCalcTab] = useState('budget'); // 'budget', 'savings', 'emergency', 'debt'
  const isDemo = checkDemoMode();

  // Helper for formatting thousand separators in input fields (dot as separator)
  const formatThousand = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const clean = val.toString().replace(/\D/g, '');
    if (!clean) return '';
    const parsed = parseInt(clean, 10);
    if (parsed === 0) return '';
    return parsed.toLocaleString('id-ID');
  };

  const parseThousand = (str) => {
    const clean = str.replace(/\D/g, '');
    return clean === '' ? 0 : parseInt(clean, 10);
  };

  // ---------------------------------------------------------
  // 1. STATE & LOGIC: KALKULATOR ANGGARAN 50/30/20
  // ---------------------------------------------------------
  const [budgetIncome, setBudgetIncome] = useState(10000000);
  const [budgetResult, setBudgetResult] = useState(null);

  const calculateBudget = (incomeVal) => {
    const needs = parseFloat((incomeVal * 0.50).toFixed(2));
    const wants = parseFloat((incomeVal * 0.30).toFixed(2));
    const savings = parseFloat((incomeVal * 0.20).toFixed(2));

    setBudgetResult({
      monthly_income: incomeVal,
      allocations: {
        needs: {
          percentage: 50,
          amount: needs,
          description: 'Kebutuhan Pokok (Sewa rumah/kos, tagihan air/listrik, belanja dapur harian, transportasi, dan cicilan utang wajib).'
        },
        wants: {
          percentage: 30,
          amount: wants,
          description: 'Keinginan Pribadi (Makan di luar/kafe, hiburan/streaming, hobi, belanja baju, dan liburan).'
        },
        savings: {
          percentage: 20,
          amount: savings,
          description: 'Tabungan & Investasi (Dana darurat, investasi reksadana/emas/saham, tabungan berjangka, dan pelunasan utang ekstra).'
        }
      },
      tips: [
        'Prioritaskan pemotongan porsi Tabungan (20%) secara otomatis begitu Anda menerima gaji (Auto-debet/Pay yourself first).',
        'Gunakan porsi 50% Kebutuhan Pokok untuk menjaga kebutuhan dasar hidup Anda tetap memenuhi kebutuhan primer.',
        'Jika alokasi Keinginan (30%) bersisa di akhir bulan, alihkan sisanya langsung ke rekening Tabungan atau Dana Darurat.'
      ]
    });
  };

  useEffect(() => {
    calculateBudget(budgetIncome);
  }, [budgetIncome]);

  // Donut Chart Data untuk Budget
  const getBudgetPieData = () => {
    if (!budgetResult) return [];
    return [
      { name: 'Kebutuhan Pokok', value: budgetResult.allocations.needs.amount, fill: '#3b82f6' },
      { name: 'Keinginan Pribadi', value: budgetResult.allocations.wants.amount, fill: '#8b5cf6' },
      { name: 'Tabungan & Investasi', value: budgetResult.allocations.savings.amount, fill: '#10b981' }
    ];
  };

  // ---------------------------------------------------------
  // 2. STATE & LOGIC: SIMULASI TARGET TABUNGAN
  // ---------------------------------------------------------
  const [savingsMode, setSavingsMode] = useState('contribution'); // 'contribution' (cari angsuran) atau 'duration' (cari durasi)
  const [savingsTarget, setSavingsTarget] = useState(50000000);
  const [savingsInitial, setSavingsInitial] = useState(5000000);
  const [savingsDuration, setSavingsDuration] = useState(24);
  const [savingsMonthlyContrib, setSavingsMonthlyContrib] = useState(2000000);
  const [savingsInterestRate, setSavingsInterestRate] = useState(6);
  const [savingsResult, setSavingsResult] = useState(null);
  const [savingsLoading, setSavingsLoading] = useState(false);
  const [showSavingsAmortization, setShowSavingsAmortization] = useState(false);
  const [savingsError, setSavingsError] = useState('');

  const handleSavingsSimulate = async (e) => {
    if (e) e.preventDefault();
    setSavingsError('');
    if (Number(savingsInitial) >= Number(savingsTarget)) {
      setSavingsError('Tabungan awal tidak boleh lebih besar atau sama dengan target nominal.');
      return;
    }

    try {
      setSavingsLoading(true);
      const payload = {
        target_amount: Number(savingsTarget),
        current_amount: Number(savingsInitial),
        annual_interest_rate: Number(savingsInterestRate)
      };

      if (savingsMode === 'contribution') {
        payload.duration_months = Number(savingsDuration);
      } else {
        payload.monthly_contribution = Number(savingsMonthlyContrib);
      }

      const res = await api.getSavingsProjection(payload);
      if (res.success) {
        setSavingsResult(res.data);
      }
    } catch (err) {
      setSavingsError(err.message || 'Gagal menghitung proyeksi tabungan.');
    } finally {
      setSavingsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // 3. STATE & LOGIC: KALKULATOR DANA DARURAT
  // ---------------------------------------------------------
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [dependentsCount, setDependentsCount] = useState(0);
  const [manualExpense, setManualExpense] = useState('');
  const [includePartner, setIncludePartner] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState('');

  const handleEmergencySimulate = async (useDbAvg = false) => {
    try {
      setEmergencyLoading(true);
      setEmergencyError('');
      const payload = {
        marital_status: maritalStatus,
        dependents_count: Number(dependentsCount),
        include_partner: includePartner
      };

      if (!useDbAvg && manualExpense) {
        payload.monthly_expense = Number(manualExpense);
      }

      const res = await api.getEmergencyFundRecommendation(payload);
      if (res.success) {
        setEmergencyResult(res.data);
        if (useDbAvg) {
          setManualExpense(Math.round(res.data.calculated_monthly_expense));
        }
      }
    } catch (err) {
      setEmergencyError(err.message || 'Gagal menghitung dana darurat.');
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Pemicu awal saat tab emergency fund dibuka
  useEffect(() => {
    if (activeCalcTab === 'emergency' && !emergencyResult) {
      handleEmergencySimulate(true); // default ambil dari DB
    }
  }, [activeCalcTab]);

  // ---------------------------------------------------------
  // 4. STATE & LOGIC: PELUNASAN UTANG (SNOWBALL VS AVALANCHE)
  // ---------------------------------------------------------
  const [debts, setDebts] = useState([
    { id: 1, name: 'Kartu Kredit A', balance: 5000000, interest_rate: 18, minimum_payment: 250000 },
    { id: 2, name: 'Pinjol B', balance: 2500000, interest_rate: 24, minimum_payment: 200000 }
  ]);
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtBalance, setNewDebtBalance] = useState('');
  const [newDebtRate, setNewDebtRate] = useState('');
  const [newDebtMinPay, setNewDebtMinPay] = useState('');
  const [extraPayment, setExtraPayment] = useState(500000);

  const [debtResult, setDebtResult] = useState(null);
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtError, setDebtError] = useState('');

  const handleAddDebt = () => {
    if (!newDebtName || !newDebtBalance || !newDebtRate || !newDebtMinPay) {
      setDebtError('Semua kolom utang baru wajib diisi.');
      return;
    }
    const balanceNum = Number(newDebtBalance);
    const minPayNum = Number(newDebtMinPay);

    if (minPayNum >= balanceNum) {
      setDebtError('Cicilan minimum harus lebih kecil dari saldo utang.');
      return;
    }

    setDebts([
      ...debts,
      {
        id: Date.now(),
        name: newDebtName,
        balance: balanceNum,
        interest_rate: Number(newDebtRate),
        minimum_payment: minPayNum
      }
    ]);

    setNewDebtName('');
    setNewDebtBalance('');
    setNewDebtRate('');
    setNewDebtMinPay('');
    setDebtError('');
  };

  const handleRemoveDebt = (id) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const handleDebtSimulate = async () => {
    if (debts.length === 0) {
      setDebtError('Harap tambahkan minimal 1 utang untuk disimulasikan.');
      return;
    }
    setDebtError('');

    try {
      setDebtLoading(true);
      const res = await api.getDebtPayoffStrategy({
        debts: debts.map(({ name, balance, interest_rate, minimum_payment }) => ({
          name,
          balance,
          interest_rate,
          minimum_payment
        })),
        extra_monthly_payment: Number(extraPayment)
      });
      if (res.success) {
        setDebtResult(res.data);
      }
    } catch (err) {
      setDebtError(err.message || 'Gagal menyimulasikan strategi pelunasan.');
    } finally {
      setDebtLoading(false);
    }
  };

  // Recharts Y-axis formatter
  const formatChartYAxis = (val) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} Rb`;
    return `Rp ${val}`;
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* HEADER WIDGET */}
      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600">
            <Calculator className="stroke-[2.5]" size={20} />
            <h3 className="text-base font-bold text-slate-900">Kalkulator Keuangan Pintar</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">Simulasikan perencanaan anggaran, tabungan, dana darurat, dan strategi pelunasan utang Anda</p>
        </div>
        <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200/40 rounded-xl text-xs max-w-max">
          <button
            onClick={() => setActiveCalcTab('budget')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeCalcTab === 'budget' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Aturan 50/30/20
          </button>
          <button
            onClick={() => setActiveCalcTab('savings')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeCalcTab === 'savings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Target Tabungan
          </button>
          <button
            onClick={() => setActiveCalcTab('emergency')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeCalcTab === 'emergency' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dana Darurat
          </button>
          <button
            onClick={() => setActiveCalcTab('debt')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeCalcTab === 'debt' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Strategi Utang
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAMPILAN TAB 1: KALKULATOR ANGGARAN 50/30/20
          ------------------------------------------------------------- */}
      {activeCalcTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
          {/* Sisi Kiri: Slider & Form Input */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase flex items-center gap-1">
                  <Sparkles size={10} /> Aturan Keuangan Populer
                </span>
                <h4 className="text-sm font-bold text-slate-900">Alokasi Pendapatan Bulanan</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Geser slider atau masukkan angka pendapatan Anda untuk membaginya secara otomatis ke porsi ideal (Kebutuhan, Keinginan, Tabungan).
                </p>
              </div>

              {/* Input & Slider */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Total Pendapatan Bersih (Rp):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatThousand(budgetIncome)}
                    onChange={(e) => setBudgetIncome(parseThousand(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1 pt-2">
                  <input
                    type="range"
                    min="1000000"
                    max="50000000"
                    step="500000"
                    value={budgetIncome || 1000000}
                    onChange={(e) => setBudgetIncome(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>1 Jt</span>
                    <span>15 Jt</span>
                    <span>30 Jt</span>
                    <span>50 Jt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut Chart Visualizer */}
            {budgetResult && (
              <div className="h-44 w-full relative flex items-center justify-center mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getBudgetPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {getBudgetPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center select-none pointer-events-none">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                  <span className="text-xs font-extrabold text-slate-900 mt-1">{formatRupiah(budgetResult.monthly_income)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Hasil & Alokasi */}
          <div className="lg:col-span-3 space-y-4">
            {budgetResult && (
              <>
                {/* 1. Kebutuhan Pokok Card */}
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
                  <span className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <h5 className="text-xs font-bold text-slate-900">Kebutuhan Pokok (Needs) — 50%</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-md">
                      {budgetResult.allocations.needs.description}
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Alokasi Dana</p>
                    <p className="text-base font-extrabold text-blue-600 mt-1">{formatRupiah(budgetResult.allocations.needs.amount)}</p>
                  </div>
                </div>

                {/* 2. Keinginan Pribadi Card */}
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
                  <span className="absolute top-0 bottom-0 left-0 w-1.5 bg-purple-500" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <h5 className="text-xs font-bold text-slate-900">Keinginan Pribadi (Wants) — 30%</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-md">
                      {budgetResult.allocations.wants.description}
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full w-[30%]" />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Alokasi Dana</p>
                    <p className="text-base font-extrabold text-purple-600 mt-1">{formatRupiah(budgetResult.allocations.wants.amount)}</p>
                  </div>
                </div>

                {/* 3. Tabungan & Investasi Card */}
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
                  <span className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h5 className="text-xs font-bold text-slate-900">Tabungan & Investasi (Savings) — 20%</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-md">
                      {budgetResult.allocations.savings.description}
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[20%]" />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Alokasi Dana</p>
                    <p className="text-base font-extrabold text-emerald-600 mt-1">{formatRupiah(budgetResult.allocations.savings.amount)}</p>
                  </div>
                </div>

                {/* Tips Edukatif */}
                <div className="p-5 bg-blue-50/50 border border-blue-100/50 rounded-3xl text-xs text-blue-800 font-semibold space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Award size={14} className="stroke-[2.5]" />
                    <span className="font-extrabold">Tips Edukasi Anggaran:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-blue-700/90 leading-relaxed font-medium">
                    {budgetResult.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAMPILAN TAB 2: SIMULASI TARGET TABUNGAN
          ------------------------------------------------------------- */}
      {activeCalcTab === 'savings' && (
        <div className="space-y-6 animate-fade-in">
          {/* Form Input Sisi Atas */}
          <form onSubmit={handleSavingsSimulate} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Simulasi Rencana Tabungan Impian</h4>
                <p className="text-[11px] text-slate-500 font-medium">Hitung target tabungan Anda dengan efek bunga tahunan</p>
              </div>
              
              {/* Selector Mode */}
              <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200/50 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => { setSavingsMode('contribution'); setSavingsResult(null); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    savingsMode === 'contribution' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Hitung Simpanan Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => { setSavingsMode('duration'); setSavingsResult(null); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    savingsMode === 'duration' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Hitung Durasi Waktu
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Nominal (Rp):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  required
                  value={formatThousand(savingsTarget)}
                  onChange={(e) => setSavingsTarget(parseThousand(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tabungan Awal (Rp):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatThousand(savingsInitial)}
                  onChange={(e) => setSavingsInitial(parseThousand(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {savingsMode === 'contribution' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Durasi Menabung (Bulan):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={savingsDuration}
                    onChange={(e) => setSavingsDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Setoran Bulanan (Rp):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    required
                    value={formatThousand(savingsMonthlyContrib)}
                    onChange={(e) => setSavingsMonthlyContrib(parseThousand(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bunga/Imbal Hasil (% Per Tahun):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={savingsInterestRate}
                  onChange={(e) => setSavingsInterestRate(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {savingsError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-xl p-3">
                ⚠ {savingsError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingsLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {savingsLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Percent size={14} className="stroke-[2.5]" />
                  Simulasikan Target Tabungan
                </>
              )}
            </button>
          </form>

          {/* Sisi Bawah: Hasil Simulasi & Chart */}
          {savingsResult && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
              
              {/* 3 Ringkasan Cards Kiri */}
              <div className="lg:col-span-2 space-y-4">
                {/* Card Setoran/Waktu */}
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm text-center flex flex-col justify-center h-[120px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {savingsMode === 'contribution' ? 'Setoran Bulanan Diperlukan' : 'Waktu Pencapaian Target'}
                  </p>
                  <p className="text-xl font-extrabold text-blue-600 mt-2">
                    {savingsMode === 'contribution' 
                      ? formatRupiah(savingsResult.monthly_contribution) 
                      : `${savingsResult.duration_months} Bulan (${(savingsResult.duration_months / 12).toFixed(1)} Tahun)`
                    }
                  </p>
                </div>

                {/* Card Pokok vs Bunga */}
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Total Pokok Tabungan:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(savingsResult.total_principal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Total Imbal Hasil/Bunga:</span>
                    <span className="font-bold text-emerald-600">+{formatRupiah(savingsResult.total_interest_earned)}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Total Akumulasi Dana:</span>
                    <span className="text-sm font-extrabold text-slate-900">{formatRupiah(savingsResult.total_accumulated)}</span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl text-[11px] text-slate-600 font-semibold space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-800 text-xs">💡 Tips Pencapaian Target:</p>
                  <p>Investasikan tabungan awal Anda pada instrumen dengan imbal hasil {savingsInterestRate}% per tahun (misalnya Reksa Dana Obligasi atau tabungan deposito) untuk memaksimalkan bunga bergulung.</p>
                </div>
              </div>

              {/* Chart Visualisasi Pertumbuhan Kanan */}
              <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex flex-col justify-between">
                <div className="space-y-1 mb-4">
                  <h5 className="text-xs font-bold text-slate-900">Kurva Akumulasi Saldo Tabungan</h5>
                  <p className="text-[10px] text-slate-500">Visualisasi pertumbuhan pokok simpanan + akumulasi bunga bergulung bulanan</p>
                </div>

                {/* Area Chart Recharts */}
                <div className="h-60 w-full" style={{ outline: 'none' }}>
                  {savingsResult.projection_schedule.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={savingsResult.projection_schedule} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                          tickFormatter={(m) => `Bln ${m}`}
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                          tickFormatter={formatChartYAxis}
                          width={60}
                        />
                        <Tooltip 
                          formatter={(value) => [formatRupiah(value), 'Saldo']} 
                          labelFormatter={(label) => `Bulan ke-${label}`}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorBalance)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-xs border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      Amortisasi tersimulasi instan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAMPILAN TAB 3: KALKULATOR DANA DARURAT
          ------------------------------------------------------------- */}
      {activeCalcTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
          {/* Sisi Kiri: Form Config */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase flex items-center gap-1">
                  <ShieldAlert size={10} /> Jaring Pengaman Finansial
                </span>
                <h4 className="text-sm font-bold text-slate-900">Konfigurasi Dana Darurat</h4>
                <p className="text-[11px] text-slate-500 font-medium">Berapa besar jaring pengaman yang Anda butuhkan secara mandiri maupun keluarga?</p>
              </div>

              {/* Status Pernikahan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Hubungan:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMaritalStatus('single')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      maritalStatus === 'single'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Lajang / Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaritalStatus('married')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      maritalStatus === 'married'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Menikah
                  </button>
                </div>
              </div>

              {/* Tanggungan/Anak */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Jumlah Tanggungan (Anak/Lainnya):</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={dependentsCount}
                  onChange={(e) => setDependentsCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Input Pengeluaran Bulanan */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Rata-rata Belanja Bulanan (Rp):</label>
                  <button
                    type="button"
                    onClick={() => handleEmergencySimulate(true)}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    Tarik dari Riwayat Transaksi
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Misal: 4.000.000"
                  value={formatThousand(manualExpense)}
                  onChange={(e) => setManualExpense(parseThousand(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Checkbox Partner */}
              {maritalStatus === 'married' && (
                <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer select-none active:scale-[0.99] transition-all">
                  <input
                    type="checkbox"
                    checked={includePartner}
                    onChange={(e) => setIncludePartner(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                    <Users size={13} className="text-slate-400" />
                    <span>Gabungkan Transaksi Pasangan</span>
                  </div>
                </label>
              )}
            </div>

            <button
              onClick={() => handleEmergencySimulate(false)}
              disabled={emergencyLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all mt-6"
            >
              {emergencyLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Hitung Target Dana Darurat'
              )}
            </button>
          </div>

          {/* Sisi Kanan: Output & Progress */}
          <div className="lg:col-span-3 space-y-4">
            {emergencyError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-xl p-3">
                ⚠ {emergencyError}
              </p>
            )}

            {emergencyResult && (
              <>
                {/* Recommended Giant Card */}
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl space-y-4 flex flex-col justify-between h-[200px]">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/60 border border-blue-900 px-3 py-1 rounded-full">
                      Rekomendasi Pengali: {emergencyResult.multiplier}x Pengeluaran
                    </span>
                    <h5 className="text-xs font-bold text-slate-400 mt-4">Kebutuhan Dana Darurat Ideal Anda:</h5>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                      {formatRupiah(emergencyResult.target_emergency_fund)}
                    </h2>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-800 pt-3">
                    <span>Pengeluaran Pokok: {formatRupiah(emergencyResult.calculated_monthly_expense)}/bln</span>
                    <span className="capitalize">Sumber: {emergencyResult.source.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Progress bar dana darurat nyata */}
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-slate-900">Progres Pengumpulan Nyata</h5>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {emergencyResult.emergency_goal_name 
                          ? `Terhubung ke Target: "${emergencyResult.emergency_goal_name}"`
                          : 'Target tabungan bernama "Dana Darurat" belum dibuat.'
                        }
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                      {emergencyResult.progress_percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, emergencyResult.progress_percentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-bold pt-1">
                    <span>Terkumpul: {formatRupiah(emergencyResult.current_savings)}</span>
                    <span>Sisa Kurang: {formatRupiah(emergencyResult.remaining_to_target)}</span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 bg-emerald-50/50 border border-emerald-100/50 rounded-3xl text-xs text-emerald-800 font-semibold space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Heart size={14} className="stroke-[2.5] fill-emerald-500/10" />
                    <span className="font-extrabold">Panduan Keamanan Dana Darurat:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-emerald-700/90 leading-relaxed font-medium">
                    {emergencyResult.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAMPILAN TAB 4: KALKULATOR PELUNASAN UTANG
          ------------------------------------------------------------- */}
      {activeCalcTab === 'debt' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
          
          {/* Sisi Kiri: Config Daftar Utang (Span 2 Kolom) */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-rose-600 tracking-widest uppercase flex items-center gap-1">
                  <Flame size={11} className="animate-pulse" /> Bebaskan Diri dari Utang
                </span>
                <h4 className="text-sm font-bold text-slate-900">Kelola Daftar Utang Anda</h4>
                <p className="text-[11px] text-slate-500 font-medium">Masukkan semua daftar kewajiban cicilan Anda beserta bunga tahunannya.</p>
              </div>

              {/* Debt Add Fields */}
              <div className="p-3 bg-slate-50/80 border border-slate-200/50 rounded-2xl space-y-3">
                <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Tambah Utang Baru:</p>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Nama Kredit (Misal: CC Bank X)"
                    value={newDebtName}
                    onChange={(e) => setNewDebtName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Saldo (Rp)"
                      value={formatThousand(newDebtBalance)}
                      onChange={(e) => setNewDebtBalance(parseThousand(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Bunga (%)"
                      value={newDebtRate}
                      onChange={(e) => setNewDebtRate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Min. Cicilan"
                      value={formatThousand(newDebtMinPay)}
                      onChange={(e) => setNewDebtMinPay(parseThousand(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDebt}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Plus size={12} className="stroke-[2.5]" /> Tambahkan Utang
                  </button>
                </div>
              </div>

              {/* Extra Payment Field */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">Tambahan Setoran Ekstra Bulanan (Rp):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatThousand(extraPayment)}
                  onChange={(e) => setExtraPayment(parseThousand(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Debt List Table */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Daftar Utang Saat Ini ({debts.length}):</p>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                  {debts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-inner-sm text-[11px] font-semibold text-slate-700">
                      <div className="truncate max-w-[120px]">
                        <p className="font-bold text-slate-900 truncate capitalize leading-none">{d.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">Saldo: {formatRupiah(d.balance)} ({d.interest_rate}%)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-bold">Min: {formatRupiah(d.minimum_payment)}/bln</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDebt(d.id)}
                          className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer shrink-0"
                          title="Hapus utang ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {debts.length === 0 && (
                    <p className="text-[10px] text-center text-slate-400 font-medium py-3">Belum ada daftar utang dimasukkan.</p>
                  )}
                </div>
              </div>
            </div>

            {debtError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-xl p-3 mt-4">
                ⚠ {debtError}
              </p>
            )}

            <button
              onClick={handleDebtSimulate}
              disabled={debtLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all mt-6"
            >
              {debtLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Simulasikan Pelunasan Utang'
              )}
            </button>
          </div>

          {/* Sisi Kanan: Output Simulasi Komparatif (Span 3 Kolom) */}
          <div className="lg:col-span-3 space-y-4">
            {debtResult ? (
              <>
                {/* Recommendation Card */}
                <div className="p-5 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100/50 rounded-3xl shadow-sm space-y-3.5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Award size={16} className="stroke-[2.5]" />
                    <h5 className="text-xs font-extrabold uppercase tracking-wide">Rekomendasi Rencana Pelunasan Terbaik:</h5>
                  </div>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                    {debtResult.comparison.recommendation}
                  </p>
                  
                  {/* Stats comparison badges */}
                  {debtResult.comparison.interest_saved_by_avalanche > 0 && (
                    <div className="flex gap-2 pt-1.5 flex-wrap">
                      <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg">
                        Avalanche Menghemat Bunga: {formatRupiah(debtResult.comparison.interest_saved_by_avalanche)}
                      </span>
                      {debtResult.comparison.months_saved_by_avalanche > 0 && (
                        <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg">
                          Lunas {debtResult.comparison.months_saved_by_avalanche} Bulan Lebih Cepat!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Grid Perbandingan Snowball vs Avalanche */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Snowball Card */}
                  <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                      <h6 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        ❄️ Debt Snowball
                      </h6>
                      <span className="text-[9px] font-extrabold bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded-md">
                        Metode Motivasi
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-semibold">Waktu Pelunasan:</span>
                        <span className="font-extrabold text-slate-900">{debtResult.strategies.snowball.months_to_payoff} Bulan</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-semibold">Total Biaya Bunga:</span>
                        <span className="font-extrabold text-rose-500">{formatRupiah(debtResult.strategies.snowball.total_interest_paid)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-50 space-y-1">
                        <span className="block font-bold">Urutan Pelunasan:</span>
                        <span className="block text-slate-700 capitalize line-clamp-1">{debtResult.strategies.snowball.payoff_order.join(' → ') || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Avalanche Card */}
                  <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                      <h6 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        ⚡ Debt Avalanche
                      </h6>
                      <span className="text-[9px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">
                        Metode Matematika
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-semibold">Waktu Pelunasan:</span>
                        <span className="font-extrabold text-slate-900">{debtResult.strategies.avalanche.months_to_payoff} Bulan</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-semibold">Total Biaya Bunga:</span>
                        <span className="font-extrabold text-emerald-600">{formatRupiah(debtResult.strategies.avalanche.total_interest_paid)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-50 space-y-1">
                        <span className="block font-bold">Urutan Pelunasan:</span>
                        <span className="block text-slate-700 capitalize line-clamp-1">{debtResult.strategies.avalanche.payoff_order.join(' → ') || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Pelunasan Ringkas */}
                <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-bold mb-3">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Lini Masa Pembayaran (Pertama-tama):</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Bulan-bulan pertama pelunasan utang, cicilan minimum dibayar untuk semua utang, lalu sisa dana ekstra ditumpuk ke:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {debtResult.strategies.avalanche.payoff_order.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold bg-slate-50 border border-slate-200/60 text-slate-700 px-2.5 py-1 rounded-xl">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-extrabold shrink-0">{idx + 1}</span>
                          <span className="capitalize">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-100 rounded-3xl bg-slate-50/50 p-6 select-none text-center">
                <Flame size={32} className="stroke-[1.5]" />
                <h5 className="text-xs font-bold text-slate-800">Simulasi Belum Dijalankan</h5>
                <p className="text-[10px] text-slate-400 font-semibold max-w-xs leading-relaxed mt-0.5">
                  Tambahkan semua tagihan/kewajiban utang Anda di sebelah kiri, lalu tekan tombol "Simulasikan Pelunasan Utang" untuk membandingkan strategi melunasi utang terbaik.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
