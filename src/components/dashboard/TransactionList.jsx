import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  SlidersHorizontal 
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/format';

export default function TransactionList({ transactions, removeTransaction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Ambil list unik kategori transaksi untuk opsi filter dropdown
  const uniqueCategories = [
    ...new Set(transactions.map(t => t.category))
  ].filter(Boolean);

  // Filter logika transaksi
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      (t.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (t.note?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 group">
      {/* HEADER & PENCARIAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <Receipt size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Transaksi</h3>
          </div>
          <p className="text-xs text-slate-500">Kelola dan telusuri transaksi Anda</p>
        </div>

        {/* INPUT PENCARIAN */}
        <div className="relative max-w-sm w-full md:w-64">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Cari kategori atau catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs bg-slate-50/30 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center flex-wrap gap-2.5 mb-6 p-3 rounded-xl bg-slate-50/50 border border-slate-100/80 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
          <SlidersHorizontal size={13} />
          <span>Filter:</span>
        </div>

        {/* Filter Tipe */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'all' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 font-bold' 
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filterType === 'income' 
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold' 
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filterType === 'expense' 
                ? 'bg-rose-50 border border-rose-100 text-rose-600 font-bold' 
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        <span className="text-slate-200">|</span>

        {/* Dropdown Filter Kategori */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Kategori</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100/80 text-slate-400 font-semibold select-none">
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Catatan</th>
              <th className="py-3 px-4">Tipe</th>
              <th className="py-3 px-4 text-right">Nominal</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-500">{formatDate(tx.date)}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-lg border border-slate-200/20">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={tx.note}>
                      {tx.note || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {isIncome ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold text-sm ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition-all"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400 font-medium">
                  Tidak ada transaksi ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MOBILE CARD LIST (Responsive Stack Layout) */}
      <div className="md:hidden space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(tx => {
            const isIncome = tx.type === 'income';
            return (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-slate-50/20 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Icon wrapper */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    isIncome ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
                  }`}>
                    {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{tx.note || tx.category}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className={`text-xs font-bold ${
                    isIncome ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                  </p>
                  <button
                    onClick={() => removeTransaction(tx.id)}
                    className="p-1.5 text-slate-300 active:text-rose-500 rounded-lg"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-slate-400 text-xs font-medium py-10">Tidak ada transaksi ditemukan</p>
        )}
      </div>
    </div>
  );
}
