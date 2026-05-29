import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertTriangle, ShieldCheck, UserCheck, Calendar, LogOut, Camera } from 'lucide-react';

export default function ProfileSection({ 
  user, 
  updateUserProfile, 
  isDemo, 
  onLogout,
  dashboardMode,
  changeDashboardMode,
  partnerInfo,
  incomingInvites,
  sendCoupleInvite,
  acceptCoupleInvite,
  rejectCoupleInvite,
  disconnectCouple
}) {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile Picture state
  const [profilePic, setProfilePic] = useState(localStorage.getItem(`user_avatar_${user?.id}`) || '');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Avatar upload states
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  // State kemitraan (Couple Shared Dashboard)
  const [partnerIdentifier, setPartnerIdentifier] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  // Loading states per action
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    if (!partnerIdentifier.trim()) {
      setInviteError('Email atau username pasangan tidak boleh kosong.');
      return;
    }
    
    try {
      setInviteSubmitting(true);
      const res = await sendCoupleInvite(partnerIdentifier.trim());
      if (res.success) {
        setInviteSuccess(res.message || 'Undangan berhasil dikirim!');
        setPartnerIdentifier('');
      } else {
        setInviteError(res.message || 'Gagal mengirimkan undangan.');
      }
    } catch (err) {
      setInviteError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      setActionLoadingId(inviteId);
      const res = await acceptCoupleInvite(inviteId);
      if (!res.success) {
        setInviteError(res.message || 'Gagal menerima undangan.');
      } else {
        setInviteSuccess('Kemitraan berhasil diterima! Mode Pasangan aktif.');
      }
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      setActionLoadingId(inviteId);
      const res = await rejectCoupleInvite(inviteId);
      if (!res.success) {
        setInviteError(res.message || 'Gagal menolak undangan.');
      } else {
        setInviteSuccess('Undangan kemitraan ditolak.');
      }
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Apakah Anda yakin ingin memutuskan hubungan dengan pasangan Anda? Data Anda berdua akan dipisahkan kembali dan dashboard kembali ke mode mandiri.')) {
      try {
        setInviteSubmitting(true);
        const res = await disconnectCouple();
        if (!res.success) {
          setInviteError(res.message || 'Gagal memutuskan hubungan.');
        } else {
          setInviteSuccess('Hubungan kemitraan berhasil diputuskan.');
        }
      } catch (err) {
        setInviteError(err.message);
      } finally {
        setInviteSubmitting(false);
      }
    }
  };

  // Sync avatar if user changes
  useEffect(() => {
    setProfilePic(localStorage.getItem(`user_avatar_${user?.id}`) || '');
  }, [user]);

  const getInitials = (name = '') => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ukuran file terlalu besar. Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using HTML canvas to keep it highly optimized in LocalStorage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Compress to 85% quality JPEG
        localStorage.setItem(`user_avatar_${user?.id}`, dataUrl);
        setProfilePic(dataUrl);

        // Dispatch global event so sidebar and mobile header update instantly
        window.dispatchEvent(new Event('auth-change'));
        setAvatarSuccess('Foto profil Anda berhasil diperbarui!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    localStorage.removeItem(`user_avatar_${user?.id}`);
    setProfilePic('');
    setAvatarError('');
    setAvatarSuccess('Foto profil berhasil dihapus.');
    window.dispatchEvent(new Event('auth-change'));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validasi input
    if (!username.trim()) {
      return setErrorMsg('Username tidak boleh kosong.');
    }

    // Validasi format username (huruf, angka, _ atau -)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      return setErrorMsg('Username harus 3-30 karakter & hanya mengandung huruf, angka, _ atau -');
    }

    if (!email.trim()) {
      return setErrorMsg('Email tidak boleh kosong.');
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return setErrorMsg('Format email tidak valid.');
    }

    // Jika password diisi, lakukan validasi pencocokan
    if (password) {
      if (password.length < 6) {
        return setErrorMsg('Password baru harus minimal 6 karakter.');
      }
      if (password !== confirmPassword) {
        return setErrorMsg('Konfirmasi password tidak cocok dengan password baru.');
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        username: username.trim(),
        email: email.trim(),
      };

      if (password) {
        payload.password = password;
      }

      const res = await updateUserProfile(payload);

      if (res.success) {
        setSuccessMsg(res.message || 'Profil Anda berhasil diperbarui!');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.message || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none animate-fade-in">

      {/* 1. KARTU RINGKASAN PROFIL (KIRI) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
          {/* Background Decorative Blur */}
          <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl group-hover:scale-125 transition-transform duration-500" />

          {/* Avatar with dynamic photo upload */}
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/20 ring-4 ring-blue-50 border-[3px] border-white transition-all duration-300 group/avatar mt-4 select-none">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black font-mono">
                {getInitials(user?.username)}
              </div>
            )}

            {/* Camera Overlay for upload */}
            <label className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
              <Camera size={18} className="stroke-[2.5] mb-1 animate-bounce-subtle" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Ubah Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Delete Photo Button if photo exists */}
          {profilePic && (
            <button
              onClick={handleDeletePhoto}
              type="button"
              className="mt-2 text-[9px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest active:scale-95"
            >
              Hapus Foto
            </button>
          )}

          {/* Avatar Upload Feedback Messages */}
          {avatarError && (
            <div className="mt-3.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100/50 text-rose-600 text-[10px] font-bold flex items-center gap-1.5 shadow-sm animate-fade-in">
              <span>⚠️</span>
              <span>{avatarError}</span>
            </div>
          )}
          {avatarSuccess && (
            <div className="mt-3.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-[10px] font-bold flex items-center gap-1.5 shadow-sm animate-fade-in">
              <span>✅</span>
              <span>{avatarSuccess}</span>
            </div>
          )}

          <div className="mt-5 space-y-1 w-full px-2">
            <h3 className="text-base font-extrabold text-slate-900 truncate capitalize">{user?.username || 'Guest'}</h3>
            <p className="text-xs text-slate-500 font-medium truncate">{user?.email || 'email@example.com'}</p>
          </div>

          <div className="w-full border-t border-slate-100/80 my-5" />

          {/* Quick Account Security Info */}
          <div className="w-full text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                <ShieldCheck size={15} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Keamanan Akun</p>
                <p className="text-xs font-bold text-slate-700">Sangat Kuat (Terenkripsi)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
                <Calendar size={15} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Hubungan</p>
                <p className="text-xs font-bold text-slate-700">
                  {isDemo ? 'Lokal Browser' : 'Tersinkron dengan Server'}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-100/80 my-4" />

          {/* Logout Button (Terutama untuk Mobile view, dipindahkan ke sini) */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs shadow-sm transition-all border border-rose-100/50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span>Keluar dari Akun</span>
          </button>

        </div>

        {/* 2. KARTU KELOLA BERSAMA PASANGAN (COUPLE SETTINGS) */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 relative overflow-hidden group select-none">
          {/* Gradients decorations */}
          <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-pink-500/5 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          
          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-50 pb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/10">
              <span className="text-base">🧑‍🤝‍🧑</span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Kelola Bersama Pasangan</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Kelola pos keuangan berdua secara transparan</p>
            </div>
          </div>

          {/* Feedback messages */}
          {inviteError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold mb-4 flex items-center gap-1.5 animate-slide-in">
              <span>⚠️</span>
              <span>{inviteError}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold mb-4 flex items-center gap-1.5 animate-slide-in">
              <span>💖</span>
              <span>{inviteSuccess}</span>
            </div>
          )}

          {partnerInfo ? (
            /* CASE 1: SUDAH TERSAMBUNG */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-50/30 to-pink-50/30 border border-pink-100/50 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md shadow-slate-100 border border-pink-100 relative mb-3 select-none">
                  <span className="text-xl animate-bounce-subtle">💑</span>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500"></span>
                  </span>
                </div>
                
                <h4 className="text-xs font-extrabold text-slate-800">Hubungan Kemitraan Aktif</h4>
                <p className="text-[11px] text-slate-505 font-bold mt-1.5 flex items-center justify-center gap-1">
                  <span>Tersambung:</span>
                  <span className="text-pink-600 font-black truncate">{partnerInfo.partner_username}</span>
                </p>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate max-w-full">
                  ({partnerInfo.partner_email})
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] text-slate-505 font-semibold leading-relaxed">
                🚀 **Dashboard Gabungan Siap**: Anda kini dapat mengaktifkan **Mode Pasangan 🧑‍🤝‍🧑** pada sidebar/header utama untuk menggabungkan data keuangan berdua secara real-time.
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={inviteSubmitting}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-100 rounded-xl font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {inviteSubmitting ? 'Memproses...' : 'Putuskan Hubungan'}
              </button>
            </div>
          ) : (
            /* CASE 2: BELUM TERSAMBUNG */
            <div className="space-y-5">
              {/* Form Kirim Undangan */}
              <form onSubmit={handleInviteSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Kirim Undangan</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                      💌
                    </span>
                    <input
                      type="text"
                      placeholder="Username atau Email pasangan"
                      value={partnerIdentifier}
                      onChange={(e) => setPartnerIdentifier(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white"
                      disabled={inviteSubmitting}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={inviteSubmitting || !partnerIdentifier.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-pink-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {inviteSubmitting ? 'Mengirim...' : 'Kirim Undangan Kemitraan'}
                </button>
              </form>

              {/* Daftar Undangan Masuk */}
              {incomingInvites && incomingInvites.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100/80">
                  <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Undangan Masuk ({incomingInvites.length})
                  </span>
                  
                  {incomingInvites.map((invite) => (
                    <div 
                      key={invite.id} 
                      className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-pink-50/20 border border-slate-100 shadow-sm flex flex-col gap-2.5 animate-pulse-subtle"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold text-slate-800 truncate capitalize">{invite.requester_username}</p>
                          <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">{invite.requester_email}</p>
                        </div>
                        <span className="text-xs shrink-0 select-none animate-pulse">💖</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(invite.id)}
                          disabled={actionLoadingId !== null}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all text-center focus:outline-none"
                        >
                          {actionLoadingId === invite.id ? 'Loading...' : 'Terima'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectInvite(invite.id)}
                          disabled={actionLoadingId !== null}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50 rounded-lg font-bold text-[10px] transition-all text-center focus:outline-none"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 2. FORM EDIT DETAIL PROFIL & PASSWORD (KANAN - COL SPAN 2) */}
      <div className="lg:col-span-2">
        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" />
              Informasi Pribadi & Kredensial
            </h3>
            <p className="text-xs text-slate-500">Perbarui data profil Anda atau ubah kata sandi secara aman</p>
          </div>

          {/* NOTIFIKASI FEEDBACK */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100/60 text-rose-600 text-xs flex items-center gap-2.5 shadow-sm shadow-rose-500/5 animate-slide-in">
              <AlertTriangle size={15} className="shrink-0 stroke-[2.5]" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100/60 text-emerald-600 text-xs flex items-center justify-between gap-2.5 shadow-sm shadow-emerald-500/5 animate-slide-in">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check size={11} className="stroke-[3]" />
                </div>
                <span className="font-semibold">{successMsg}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email Pengguna</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100/80 my-4" />

          {/* BAGIAN GANTI PASSWORD */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800">Ubah Kata Sandi (Opsional)</h4>
              <p className="text-[10px] text-slate-400 font-medium">Biarkan kosong jika Anda tidak ingin mengganti kata sandi saat ini</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password Baru</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Konfirmasi Password Baru</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 select-none flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
