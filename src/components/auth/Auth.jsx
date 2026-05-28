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
  EyeOff
} from 'lucide-react';

export default function Auth({ login, register }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Input fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
        // Logika Login
        const identifier = email || username; // Bisa diisi username atau email
        if (!identifier || !password) {
          throw new Error('Semua kolom wajib diisi.');
        }
        
        const res = await login(identifier, password);
        if (!res.success) {
          throw new Error(res.message || 'Gagal masuk.');
        }
      } else {
        // Logika Registrasi
        if (!username || !email || !password) {
          throw new Error('Semua kolom wajib diisi.');
        }
        if (password.length < 6) {
          throw new Error('Password minimal harus 6 karakter.');
        }

        const res = await register(username, email, password);
        if (res.success) {
          setSuccessMsg(res.message || 'Registrasi berhasil! Silakan masuk.');
          setIsLogin(true);
          // Reset fields except username/email for logging in
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
    <div className="min-h-screen w-full bg-slate-950 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      
      {/* 1. BACKGROUND DYNAMIC BLUR GLOWS */}
      <div className="absolute top-1/4 -left-1/4 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-blue-600/20 blur-[100px] sm:blur-[120px] animate-pulse duration-4000" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-emerald-600/20 blur-[100px] sm:blur-[120px] animate-pulse duration-6000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      {/* 2. MAIN SPLIT/GLASS CARD */}
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 animate-fade-in">
        
        {/* LEFT BRAND SIDE (DESKTOP HIDDEN ON MOBILE) */}
        <div className="flex-1 p-8 sm:p-12 md:p-16 bg-gradient-to-br from-blue-950/40 via-slate-900/30 to-emerald-950/20 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-850 relative">
          
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
          
          {/* Top Brand Logo */}
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 tracking-wider uppercase">
              <Sparkles size={13} className="animate-spin duration-3000" />
              Real-time Finance
            </div>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <TrendingUp size={20} className="stroke-[2.5]" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Keuangan<span className="text-blue-500">.hub</span></h1>
            </div>
          </div>

          {/* Middle Pitch Text */}
          <div className="my-12 md:my-0 relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Atur Arus Kas <br />
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Lebih Mudah & Aman.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
              Kelola transaksi harian, pos anggaran belanja bulanan, dan wujudkan tabungan impian Anda dalam satu platform finansial terintegrasi yang super privat.
            </p>
          </div>

          {/* Bottom Trust Badge */}
          <div className="hidden md:flex items-center gap-4 border-t border-slate-800/80 pt-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/60">
              <LockKeyhole size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Enkripsi Tingkat Tinggi</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Password di-hash secara asimetris & sesi terjamin JWT + Refresh Token aman.</p>
            </div>
          </div>
        </div>

        {/* RIGHT INPUT FORM SIDE */}
        <div className="w-full md:w-[480px] p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Header switch state info */}
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {isLogin ? 'Selamat Datang!' : 'Buat Akun Baru'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1.5">
              {isLogin ? 'Belum punya akun keuangan?' : 'Sudah punya akun sebelumnya?'}{' '}
              <button 
                onClick={handleSwitchTab}
                className="text-blue-500 hover:text-blue-400 font-bold transition-colors underline underline-offset-4 focus:outline-none"
              >
                {isLogin ? 'Daftar Gratis' : 'Masuk di sini'}
              </button>
            </p>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="mb-6 p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Username Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username unik"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all duration-300 group-hover:border-slate-700 focus:group-hover:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Email / Username Field (Login uses this as dynamic email/username) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isLogin ? 'Username / Email' : 'Email Address'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  {isLogin ? <User size={16} /> : <Mail size={16} />}
                </div>
                <input
                  type={isLogin ? "text" : "email"}
                  required
                  placeholder={isLogin ? "Masukkan username atau email Anda" : "nama@domain.com"}
                  value={isLogin ? username : email}
                  onChange={(e) => isLogin ? setUsername(e.target.value) : setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all duration-300 group-hover:border-slate-700 focus:group-hover:border-blue-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors focus:outline-none hidden sm:block">
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isLogin ? "••••••••" : "Buat password aman"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all duration-300 group-hover:border-slate-700 focus:group-hover:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-400 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/10 hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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

        </div>
      </div>
    </div>
  );
}
