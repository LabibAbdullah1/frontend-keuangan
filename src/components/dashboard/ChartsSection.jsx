import React from 'react';
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

export default function ChartsSection({ cashflowTrend, categoryExpenses }) {
  // Format data cashflow untuk grafik
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

  // Hitung total pengeluaran untuk persentase donut chart
  const totalExpense = categoryExpenses.reduce((sum, item) => sum + item.total_amount, 0);

  // Ambil warna kategori atau fallback
  const getCategoryColor = (category, index) => {
    return CATEGORY_COLORS[category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* 1. TREN ARUS KAS BULANAN (Area Chart - Span 3 Kolom) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 lg:col-span-3 flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                <BarChart3 size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Arus Kas Bulanan</h3>
            </div>
            <p className="text-xs text-slate-500">Perbandingan pemasukan dan pengeluaran</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-semibold text-slate-500 mr-2">Pemasukan</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-semibold text-slate-500">Pengeluaran</span>
          </div>
        </div>

        <div className="h-72 w-full">
          {formattedCashflow.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedCashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => `Rp ${val >= 1000000 ? (val / 1000000) + 'M' : val}`}
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
      </div>

      {/* 2. DISTRIBUSI PENGELUARAN (Donut Chart - Span 2 Kolom) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between group">
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <PieIcon size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Alokasi Pengeluaran</h3>
          </div>
          <p className="text-xs text-slate-500">Distribusi pengeluaran per kategori</p>
        </div>

        <div className="relative flex items-center justify-center h-48">
          {categoryExpenses.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="total_amount"
                    nameKey="category"
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCategoryColor(entry.category, index)} 
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
