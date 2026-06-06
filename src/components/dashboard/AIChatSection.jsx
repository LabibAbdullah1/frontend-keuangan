import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, X } from 'lucide-react';
import { api } from '../../services/api';

const QUICK_SUGGESTIONS = [
  'Analisis pengeluaranku bulan ini',
  'Beri tips hemat untuk pos anggaran paling tinggi',
  'Berapa dana darurat ideal untukku?',
  'Bagaimana menerapkan metode budget 50/30/20?'
];

export default function AIChatSection({ dashboardMode }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      message: 'Halo! Saya KeuanganKu AI. Saya bisa membantu Anda menganalisis kondisi keuangan Anda secara otomatis, memberikan tips penghematan, dan merekomendasikan alokasi anggaran terbaik. Ada yang bisa saya bantu hari ini?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    // Add user message
    const userMessage = { role: 'user', message: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Prepare history in the format expected by Gemini startChat
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.message }]
      }));

      const response = await api.chatWithAI(text, history, dashboardMode);

      if (response && response.success && response.data) {
        setMessages((prev) => [...prev, { role: 'model', message: response.data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', message: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba kembali.' }
        ]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', message: `Gagal terhubung dengan asisten AI: ${error.message || 'Error tidak diketahui'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-210px)] min-h-[380px]">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">KeuanganKu AI</h3>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Aktif & Responsif
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                isUser ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {isUser ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                isUser 
                  ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-sm' 
                  : 'bg-slate-50 text-slate-800 border-slate-100/80 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-line break-words">{msg.message}</div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 shrink-0 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div className="p-3 bg-slate-50 text-slate-800 border border-slate-100/80 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions & Input */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30 rounded-b-2xl space-y-3 shrink-0">
        
        {/* Quick suggestions shown when message history is just the greeting */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2">
            {QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-blue-400/40 text-left active:scale-[0.98]"
              >
                💡 {sug}
              </button>
            ))}
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} 
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan analisis saldo, tips hemat, atau saran investasi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-bold text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}
