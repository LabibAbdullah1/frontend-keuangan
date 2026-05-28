import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

// Palet warna premium untuk Donut Chart
const CATEGORY_COLORS = {
  'Makanan': '#3b82f6',       // Biru Cerah
  'Transportasi': '#0ea5e9',  // Sky Blue
  'Hiburan': '#8b5cf6',       // Ungu Violet
  'Tagihan': '#f43f5e',       // Rose Red
  'Kesehatan': '#10b981',     // Emerald Green
  'Pendidikan': '#f59e0b',    // Amber Orange
  'Lain-lain': '#64748b'      // Slate Grey
};

const DEFAULT_COLORS = ['#3b82f6', '#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#64748b'];

// Custom Tooltip premium bergaya Stripe/Vercel
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100/80 shadow-lg rounded-xl p-3.5 select-none animate-fade-in text-xs">
        <p className="font-semibold text-slate-800 mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.payload.fill }} />
                <span className="text-slate-500">{p.name}:</span>
              </div>
              <span className="font-bold text-slate-900">{formatRupiah(p.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Helper untuk memformat angka Y-Axis secara ringkas dan premium (Rupiah Indonesia)
const formatYAxis = (val) => {
  const num = Number(val);
  if (isNaN(num)) return val;
  if (num === 0) return 'Rp 0';
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(1).replace(/\.0$/, '')} Jt`;
  }
  if (num >= 1000) {
    return `Rp ${(num / 1000).toFixed(0)} Rb`;
  }
  return `Rp ${num}`;
};

export default function ChartsSection({ cashflowTrend, categoryExpenses, transactions = [] }) {
  const [viewType, setViewType] = useState('daily'); // Default langsung menampilkan Harian (Bulan Ini) untuk visualisasi harian

  // Format data cashflow bulanan untuk grafik
  const formattedCashflow = cashflowTrend.map(item => {
    // Ubah format "2026-05" menjadi nama bulan singkat "Mei 26"
    const [year, month] = item.month.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthName = months[parseInt(month, 10) - 1] || item.month;
    return {
      ...item,
      label: `${monthName} ${year.slice(2)}`,
      'Pemasukan': item.income,
      'Pengeluaran': item.expense
    };
  });

  // Generate data harian untuk bulan berjalan secara dinamis & aman zona waktu
  const getDailyData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed (Mei = 4)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Inisialisasi peta harian 1 - 31 hari
    const dailyMap = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyMap.push({
        date: dateStr,
        label: `${day} ${months[month]}`,
        'Pemasukan': 0,
        'Pengeluaran': 0
      });
    }

    // Filter transaksi untuk bulan berjalan saja
    const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonthStr));

    // Agregasikan jumlah nominal harian
    monthlyTransactions.forEach(t => {
      const match = dailyMap.find(d => d.date === t.date);
      if (match) {
        if (t.type === 'income') match['Pemasukan'] += Number(t.amount);
        if (t.type === 'expense') match['Pengeluaran'] += Number(t.amount);
      }
    });

    return dailyMap;
  };

  const chartData = viewType === 'daily' ? getDailyData() : formattedCashflow;

  // Hitung total pengeluaran untuk persentase donut chart
  const totalExpense = categoryExpenses.reduce((sum, item) => sum + item.total_amount, 0);

  // Ambil warna kategori atau fallback
  const getCategoryColor = (category, index) => {
    return CATEGORY_COLORS[category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* 1. TREN ARUS KAS (Area Chart - Span 3 Kolom) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 lg:col-span-3 flex flex-col justify-between group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                <BarChart3 size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {viewType === 'daily' ? 'Arus Kas Harian (Bulan Ini)' : 'Arus Kas Bulanan (Tren)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {viewType === 'daily' ? 'Mutasi arus kas harian Anda dari hari ke hari' : 'Tren perbandingan arus kas dari bulan ke bulan'}
            </p>
          </div>
          
          <div className="flex items-center flex-wrap gap-4 select-none">
            {/* Toggle Harian / Bulanan Premium */}
            <div className="inline-flex p-0.5 bg-slate-100/80 border border-slate-200/50 rounded-xl text-[10px]">
              <button
                type="button"
                onClick={() => setViewType('daily')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewType === 'daily'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setViewType('monthly')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewType === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bulanan
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-semibold text-slate-500">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[9px] font-semibold text-slate-500">Pengeluaran</span>
              </div>
            </div>
          </div>
        </div>
 
        <div className="h-72 w-full" style={{ outline: 'none' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  interval={viewType === 'daily' ? 6 : 0} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={formatYAxis}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="Pemasukan" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Pengeluaran" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <TrendingUp size={28} className="stroke-[1.5]" />
              <p className="text-xs font-medium">Belum ada data cashflow</p>
            </div>
          )}
        </div>

        {/* Tip Edukatif jika hanya ada 1 data bulan aktif (Mencegah kebingungan user tentang pengelompokan bulanan) */}
        {viewType === 'monthly' && formattedCashflow.length === 1 && (
          <div className="mt-4.5 p-3.5 rounded-xl bg-blue-50/40 border border-blue-100/50 text-[10px] text-blue-700 font-semibold leading-relaxed flex items-start gap-2 animate-fade-in select-none">
            <span className="text-xs">💡</span>
            <p>
              Grafik saat ini disetel ke mode <strong>Bulanan</strong>. Karena seluruh transaksi Anda saat ini tercatat pada bulan <strong>{formattedCashflow[0].label}</strong>, data disatukan dalam satu titik akumulasi. Tekan tombol <strong>"Harian"</strong> di kanan atas untuk memantau mutasi belanja harian Anda secara detail di bulan ini!
            </p>
          </div>
        )}
      </div>

      {/* 2. DISTRIBUSI PENGELUARAN (Donut Chart - Span 2 Kolom) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between group">
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <PieIcon size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Alokasi Pengeluaran</h3>
          </div>
          <p className="text-xs text-slate-500">Distribusi pengeluaran per kategori</p>
        </div>

        <div className="relative flex items-center justify-center h-48" style={{ outline: 'none' }}>
          {categoryExpenses.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                <PieChart style={{ outline: 'none' }}>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="total_amount"
                    nameKey="category"
                    style={{ outline: 'none' }}
                    isAnimationActive={true}
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCategoryColor(entry.category, index)}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Tengah Donut (Total Pengeluaran) */}
              <div className="absolute flex flex-col items-center justify-center select-none pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-sm font-bold text-slate-900">{formatRupiah(totalExpense)}</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <PieIcon size={28} className="stroke-[1.5]" />
              <p className="text-xs font-medium">Tidak ada transaksi bulan ini</p>
            </div>
          )}
        </div>

        {/* Legend List */}
        <div className="mt-4 max-h-[120px] overflow-y-auto pr-1 space-y-1.5">
          {categoryExpenses.length > 0 ? (
            categoryExpenses.map((entry, index) => {
              const color = getCategoryColor(entry.category, index);
              const percentage = totalExpense > 0 ? ((entry.total_amount / totalExpense) * 100).toFixed(0) : 0;
              return (
                <div key={entry.category} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-slate-700 truncate max-w-[100px]">{entry.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{formatRupiah(entry.total_amount)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold w-7 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[11px] text-center text-slate-400 font-medium">Buat pengeluaran baru untuk melihat rincian</p>
          )}
        </div>
      </div>

    </div>
  );
}
