import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  LockKeyhole,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Wallet,
  ShieldCheck,
  BarChart3,
  Target
} from 'lucide-react';

// Feature highlight items untuk panel kiri
const FEATURES = [
  { icon: BarChart3,  label: 'Analisis Arus Kas',  desc: 'Pantau pemasukan & pengeluaran harian secara visual.' },
  { icon: Target,     label: 'Target Tabungan',    desc: 'Tetapkan goals finansial dan pantau progresnya.' },
  { icon: ShieldCheck, label: 'Aman & Terenkripsi', desc: 'Data terlindungi dengan JWT & bcrypt.' },
];

export default function Auth({ login, register }) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  const handleSwitchTab = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const identifier = username;
        if (!identifier || !password) throw new Error('Semua kolom wajib diisi.');
        const res = await login(identifier, password);
        if (!res.success) throw new Error(res.message || 'Gagal masuk.');
      } else {
        if (!username || !email || !password) throw new Error('Semua kolom wajib diisi.');
        if (password.length < 6) throw new Error('Password minimal harus 6 karakter.');
        const res = await register(username, email, password);
        if (res.success) {
          setSuccessMsg(res.message || 'Registrasi berhasil! Silakan masuk.');
          setIsLogin(true);
          setPassword('');
        } else {
          throw new Error(res.message || 'Gagal mendaftar.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans relative">

      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-100/80 blur-3xl" />
        {/* Grid dots pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      {/* MAIN CARD */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 flex flex-col md:flex-row overflow-hidden relative z-10 animate-fade-in">

        {/* ════════════════════════════════════════════
            LEFT BRAND PANEL
        ════════════════════════════════════════════ */}
        <div className="hidden md:flex flex-col justify-between flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-10 lg:p-14 relative overflow-hidden">

          {/* Decorative circles inside left panel */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-20 w-64 h-64 rounded-full bg-blue-500/30" />
          <div className="absolute top-1/2 right-8 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl" />

          {/* Top: Brand Logo */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-[10px] font-bold text-blue-100 tracking-widest uppercase mb-6">
              <Sparkles size={11} />
              Personal Finance Hub
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner backdrop-blur-sm">
                <Wallet size={22} className="stroke-[2]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                  Keuangan<span className="text-blue-200">Ku</span>
                </h1>
                <span className="text-[10px] font-semibold text-blue-200/70 uppercase tracking-widest">Pro Tracker</span>
              </div>
            </div>
          </div>

          {/* Middle: Pitch */}
          <div className="relative z-10 my-10">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Kendalikan <br />
              Keuangan Anda <br />
              <span className="text-blue-200">Lebih Cerdas.</span>
            </h2>
            <p className="mt-4 text-sm text-blue-100/80 font-medium leading-relaxed max-w-xs">
              Catat transaksi, atur anggaran bulanan, dan capai target tabungan dalam satu dashboard yang elegan.
            </p>
          </div>

          {/* Feature list */}
          <div className="relative z-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-blue-100 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[10px] text-blue-200/70 font-medium mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT FORM PANEL
        ════════════════════════════════════════════ */}
        <div className="w-full md:w-[460px] p-8 sm:p-10 lg:p-12 flex flex-col justify-center">

          {/* Mobile-only brand header */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet size={20} className="stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">KeuanganKu</h1>
              <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-widest">Pro Tracker</span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mb-8">
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200/60 rounded-2xl mb-6 text-xs">
              <button
                type="button"
                onClick={() => !isLogin && handleSwitchTab()}
                className={`px-5 py-2 rounded-xl font-bold transition-all duration-300 focus:outline-none ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => isLogin && handleSwitchTab()}
                className={`px-5 py-2 rounded-xl font-bold transition-all duration-300 focus:outline-none ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar
              </button>
            </div>

            <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              {isLogin ? 'Selamat Datang!' : 'Buat Akun Baru'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              {isLogin
                ? 'Masukkan kredensial Anda untuk melanjutkan'
                : 'Daftarkan diri dan mulai kelola keuangan Anda'}
            </p>
          </div>

          {/* Alert: Error */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Alert: Success */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-600">

            {/* Username (always visible) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  required
                  placeholder={isLogin ? "Masukkan username Anda" : "Buat username unik"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50/30 group-hover:border-slate-300"
                />
              </div>
            </div>

            {/* Email (Register only) */}
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="nama@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50/30 group-hover:border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isLogin ? '••••••••' : 'Buat password aman (min. 6 karakter)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50/30 group-hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 hover:scale-[1.01] focus:outline-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sedang Diproses...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Masuk ke Aplikasi' : 'Buat Akun Sekarang'}</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Security footer badge */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <LockKeyhole size={13} className="text-emerald-600" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Data Anda dienkripsi dengan <strong className="text-slate-500">bcrypt + JWT</strong>. Kami tidak pernah menyimpan password dalam teks biasa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
