import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Tags, 
  Lock, 
  AlertTriangle, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';

export default function CategorySection({ 
  categories, 
  addCategory, 
  editCategory, 
  removeCategory 
}) {
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'income'
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State Edit Modal
  const [editingCat, setEditingCat] = useState(null); // { id, name, type }
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  // State Delete Modal
  const [deletingCat, setDeletingCat] = useState(null); // { id, name, type }

  // Filter categories based on active tab
  const filteredCategories = categories.filter(c => c.type === activeTab);

  // Group into System (user_id === null) and Custom
  const systemCategories = filteredCategories.filter(c => c.user_id === null);
  const customCategories = filteredCategories.filter(c => c.user_id !== null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      return setError('Nama kategori tidak boleh kosong');
    }

    setSubmitting(true);
    const res = await addCategory({
      name: name.trim(),
      type: activeTab
    });
    setSubmitting(false);

    if (res.success) {
      setName('');
      setSuccess('Kategori kustom berhasil ditambahkan!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.message || 'Gagal menambahkan kategori.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editName.trim()) {
      return setEditError('Nama kategori tidak boleh kosong');
    }

    setSubmitting(true);
    const res = await editCategory(editingCat.id, editName.trim());
    setSubmitting(false);

    if (res.success) {
      setEditingCat(null);
      setEditName('');
      setSuccess('Nama kategori berhasil diperbarui!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setEditError(res.message || 'Gagal memperbarui kategori.');
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;

    setSubmitting(true);
    const res = await removeCategory(deletingCat.id);
    setSubmitting(false);

    if (res.success) {
      setDeletingCat(null);
      setSuccess('Kategori berhasil dihapus.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Tags size={14} className="text-blue-500" />
            Pengaturan Aplikasi
          </h3>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">Kelola Kategori Keuangan</h2>
          <p className="text-xs text-slate-500 font-medium">Buat dan sesuaikan kategori transaksi Anda sesuai kebutuhan.</p>
        </div>
      </div>

      {/* TABS SWITCHER */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('expense');
            setError('');
          }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 focus:outline-none ${
            activeTab === 'expense'
              ? 'border-rose-600 text-rose-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight size={14} className={activeTab === 'expense' ? 'text-rose-600' : 'text-slate-400'} />
          Kategori Pengeluaran
        </button>
        <button
          onClick={() => {
            setActiveTab('income');
            setError('');
          }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 focus:outline-none ${
            activeTab === 'income'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft size={14} className={activeTab === 'income' ? 'text-emerald-600' : 'text-slate-400'} />
          Kategori Pemasukan
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in font-semibold">
          <Check size={16} className="text-emerald-600 shrink-0 stroke-[2.5]" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-850 text-xs flex items-center gap-2.5 animate-fade-in font-semibold">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 stroke-[2.5]" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER COLS: CATEGORIES LIST */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              Daftar Kategori Terdaftar
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {filteredCategories.length} Total
              </span>
            </h3>

            {/* Custom/Kustom Categories Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori Kustom Anda</h4>
              {customCategories.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center select-none">
                  <p className="text-xs text-slate-400 font-semibold">Belum ada kategori kustom.</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Gunakan formulir di sebelah kanan untuk menambahkan kategori baru.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customCategories.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/40 flex items-center justify-between hover:bg-slate-50 transition-all group"
                    >
                      <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat(cat);
                            setEditName(cat.name);
                            setEditError('');
                          }}
                          className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200/50 transition-all text-slate-500"
                          title="Ubah Nama"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCat(cat)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-transparent hover:border-rose-100 transition-all text-slate-500"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 my-6" />

            {/* System/Bawaan Categories Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Kategori Bawaan Sistem
                <Lock size={10} className="text-slate-400" />
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {systemCategories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="p-3 rounded-xl bg-slate-50/20 border border-slate-200/20 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-600">{cat.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/20">
                      Bawaan
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COL: FORM ADD & SYSTEM TIPS */}
        <div className="space-y-6">
          {/* Add Category Form Card */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <Plus size={16} className="text-blue-600" />
              Tambah Kategori Kustom
            </h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Kategori Baru
                </label>
                <input
                  type="text"
                  maxLength="50"
                  placeholder="Contoh: Hobi Gaming, Kosmetik, dll"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-900 placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipe Transaksi
                </label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold flex items-center justify-between text-slate-700 capitalize">
                  <span>{activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${activeTab === 'expense' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Plus size={14} className="stroke-[2.5]" />
                {submitting ? 'Menyimpan...' : 'Tambah Kategori'}
              </button>
            </form>
          </div>

          {/* System Info Tips Card */}
          <div className="bg-gradient-to-tr from-blue-50/40 via-white to-indigo-50/40 border border-slate-100 shadow-sm rounded-2xl p-6">
            <h4 className="text-xs font-bold text-slate-950 flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-blue-600 stroke-[2.5]" />
              Informasi Penggunaan
            </h4>
            <div className="space-y-3.5 text-[10px] font-semibold text-slate-500 leading-relaxed">
              <div className="flex gap-2">
                <span className="text-blue-500 shrink-0">💡</span>
                <p>Kategori kustom baru otomatis tersedia pada dropdown modal transaksi, form target anggaran, dan transaksi berulang.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-500 shrink-0">🔄</span>
                <p>Mengubah nama kategori kustom akan otomatis memperbarui seluruh catatan transaksi, anggaran, dan template transaksi berulang yang ada.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-rose-500 shrink-0">⚠️</span>
                <p>Menghapus kategori kustom akan mengalihkan catatan transaksi/anggaran terkait ke kategori <strong>"Lain-lain"</strong> tanpa menghapus nominal keuangannya.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* EDIT MODAL DIALOG */}
      {editingCat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 max-w-sm w-full relative animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Ubah Nama Kategori</h3>
              <button 
                onClick={() => setEditingCat(null)} 
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] flex items-center gap-2 animate-fade-in font-semibold">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Baru
                </label>
                <input
                  type="text"
                  maxLength="50"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-xl font-bold border border-slate-200 text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-center active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingCat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 max-w-sm w-full relative animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-950">Hapus Kategori Kustom</h3>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-5">
              Apakah Anda yakin ingin menghapus kategori kustom <strong>"{deletingCat.name}"</strong>? 
              <br /><br />
              Seluruh transaksi, anggaran, dan template transaksi berulang yang saat ini menggunakan kategori ini akan otomatis dialihkan ke kategori <strong>"Lain-lain"</strong> agar catatan keuangan Anda tetap utuh.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs border border-slate-200 text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs text-center disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
