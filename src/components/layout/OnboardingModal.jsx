import React, { useState } from 'react';
import { 
  Sparkles, 
  WifiOff, 
  PieChart, 
  Target, 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  BookOpen,
  Camera,
  TrendingUp
} from 'lucide-react';

export default function OnboardingModal({ isOpen, onClose, user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Selamat Datang di KeuanganKu! 🚀",
      description: "Asisten finansial pribadi cerdas Anda untuk memantau pemasukan, pengeluaran, batasan anggaran, dan tabungan impian bulanan dalam satu dashboard premium.",
      icon: Sparkles,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "from-blue-600 to-indigo-600"
    },
    {
      title: "Pemindai Struk Belanja Otomatis (AI Scanner) 📸",
      description: "Foto struk belanjaan fisik Anda (Indomaret, restoran, dll) atau unggah gambar. AI Gemini secara cerdas akan mendeteksi nominal total belanja, tanggal transaksi, nama toko, dan mencocokkan kategorinya secara instan.",
      icon: Camera,
      color: "bg-orange-50 text-orange-600 border-orange-100",
      accent: "from-orange-500 to-amber-500"
    },
    {
      title: "Prediksi Arus Kas Bulan Depan (AI Forecast) 📈",
      description: "Analisis kebiasaan finansial bulanan Anda secara prediktif. AI Forecast memperkirakan total pemasukan, pengeluaran, dan tingkat risiko defisit cashflow bulan depan lengkap dengan saran mitigasi penting.",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      accent: "from-indigo-600 to-purple-650"
    },
    {
      title: "Pencatatan Offline & Auto-Sync 🔒",
      description: "Mencatat tetap lancar meski koneksi internet terputus. Data disimpan dengan aman dan terenkripsi secara lokal di perangkat Anda, lalu disinkronkan otomatis saat Anda kembali online.",
      icon: WifiOff,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "from-amber-500 to-orange-500"
    },
    {
      title: "Batas Anggaran Belanja (Budgeting) 📊",
      description: "Atur limit anggaran belanja per kategori untuk mendisiplinkan pengeluaran bulanan. Dapatkan peringatan visual instan jika anggaran terpakai 75% (kuning) atau habis 100% (merah).",
      icon: PieChart,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      accent: "from-purple-600 to-indigo-600"
    },
    {
      title: "Target Tabungan & Kalkulator Pintar 🎯",
      description: "Rencanakan resolusi keuangan masa depan lewat target tabungan terarah. Simulasikan strategi pembagian gaji 50/30/20, dana darurat ideal, serta pelunasan utang snowball/avalanche.",
      icon: Target,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "from-emerald-500 to-teal-500"
    },
    {
      title: "Mode Bersama Pasangan (Couple Hub) 🧑‍🤝‍🧑",
      description: "Hubungkan akun keuangan dengan pasangan secara real-time di halaman Profil. Aktifkan Mode Pasangan di header utama untuk menyatukan pencatatan arus kas berdua secara transparan.",
      icon: Heart,
      color: "bg-pink-50 text-pink-600 border-pink-100",
      accent: "from-blue-500 to-pink-500"
    }
  ];

  const handleNext = () => {
    if (dontShowAgain) {
      handleComplete();
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`has_completed_onboarding_${user.id}`, 'true');
    }
    onClose();
  };

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4 select-none animate-fade-in">
      <div 
        className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 sm:p-7 max-w-md w-full relative animate-fade-in flex flex-col justify-between min-h-[430px]"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP STATUS BAR (STEP DOTS & SKIP BUTTON) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panduan Aplikasi ({currentStep + 1}/7)</span>
          </div>
          
          <button
            onClick={handleComplete}
            type="button"
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
          >
            Lewati
          </button>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="flex-1 flex flex-col items-center text-center justify-center py-4 space-y-4">
          {/* Animated Big Icon Wrapper */}
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-inner-sm transition-transform duration-300 hover:scale-105 ${activeStep.color}`}>
            <StepIcon size={32} className="stroke-[2.2]" />
          </div>

          {/* Title & Desc */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight leading-snug">
              {activeStep.title}
            </h3>
            <p className="text-[11.5px] leading-relaxed text-slate-500 font-medium px-1">
              {activeStep.description}
            </p>
          </div>
        </div>

        {/* BOTTOM NAVIGATION & CHECKBOX AREA */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-4">
          
          {/* Checkbox "Jangan Tampilkan Lagi" */}
          <label className="flex items-center gap-2 cursor-pointer select-none self-start">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-505 font-bold text-slate-500">
              Jangan tampilkan panduan ini lagi
            </span>
          </label>

          {/* Buttons Navigation */}
          <div className="flex items-center gap-3 w-full">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                type="button"
                className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1 active:scale-[0.98] justify-center"
              >
                <ArrowLeft size={13} className="stroke-[2.5]" />
                <span>Kembali</span>
              </button>
            )}

            <button
              onClick={handleNext}
              type="button"
              className={`flex-1 py-2.5 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] bg-gradient-to-r ${activeStep.accent} shadow-blue-500/10 hover:opacity-95`}
            >
              {dontShowAgain ? (
                <>
                  <Check size={13} className="stroke-[2.5]" />
                  <span>Paham & Tutup</span>
                </>
              ) : isLastStep ? (
                <>
                  <Check size={13} className="stroke-[2.5]" />
                  <span>Paham & Mulai</span>
                </>
              ) : (
                <>
                  <span>Selanjutnya</span>
                  <ArrowRight size={13} className="stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-1">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                type="button"
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === idx ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200'
                }`}
                title={`Buka Langkah ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
