import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { QrCode, ArrowRight, ShieldCheck, Shuffle, Sparkles, Check, AlertCircle } from 'lucide-react';
import { ButtonSpinner } from '../Shared/Loaders';
import { BrandLogo } from '../Shared/BrandLogo';
import { validateParticipantName } from '../../utils/profanityFilter';

export interface AvatarPersona {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  bgGradient: string;
  bgColor: string;
}

export const AVATAR_PERSONAS: AvatarPersona[] = [
  { id: 'fox', emoji: '🦊', name: 'Fox', tagline: 'Cerdik & Cepat', bgGradient: 'from-amber-500 to-orange-600', bgColor: '#EA580C' },
  { id: 'panda', emoji: '🐼', name: 'Panda', tagline: 'Santai & Fokus', bgGradient: 'from-emerald-500 to-teal-700', bgColor: '#0D9488' },
  { id: 'lion', emoji: '🦁', name: 'Lion', tagline: 'Pemberani & Tegas', bgGradient: 'from-amber-400 to-amber-600', bgColor: '#D97706' },
  { id: 'cat', emoji: '🐱', name: 'Neko', tagline: 'Kreatif & Lincah', bgGradient: 'from-rose-400 to-pink-600', bgColor: '#E11D48' },
  { id: 'shiba', emoji: '🐶', name: 'Shiba', tagline: 'Setia & Ramah', bgGradient: 'from-orange-400 to-amber-500', bgColor: '#F59E0B' },
  { id: 'bot', emoji: '🤖', name: 'PulseBot', tagline: 'Canggih & Tepat', bgGradient: 'from-indigo-500 to-blue-700', bgColor: '#4F46E5' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', tagline: 'Ajaib & Visioner', bgGradient: 'from-purple-500 to-fuchsia-600', bgColor: '#9333EA' },
  { id: 'owl', emoji: '🦉', name: 'Owl', tagline: 'Bijak & Analitis', bgGradient: 'from-sky-500 to-indigo-700', bgColor: '#0284C7' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', tagline: 'Enerjik & Kuat', bgGradient: 'from-amber-500 to-rose-600', bgColor: '#E11D48' },
  { id: 'dragon', emoji: '🐲', name: 'Dragon', tagline: 'Legendaris', bgGradient: 'from-emerald-400 to-green-700', bgColor: '#059669' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', tagline: 'Keren & Rapi', bgGradient: 'from-cyan-500 to-blue-600', bgColor: '#0891B2' },
  { id: 'bunny', emoji: '🐰', name: 'Bunny', tagline: 'Ceria & Cekatan', bgGradient: 'from-pink-400 to-rose-500', bgColor: '#DB2777' },
];

interface ParticipantJoinProps {
  onJoined?: () => void;
}

export const ParticipantJoin: React.FC<ParticipantJoinProps> = ({ onJoined }) => {
  const { currentEvent, joinRoom, error, clearError } = useEvent();
  const [roomCode, setRoomCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code')?.toUpperCase() || '';
  });
  const [nickname, setNickname] = useState('');
  const [localNameError, setLocalNameError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<AvatarPersona>(() => AVATAR_PERSONAS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check URL query parameters for auto code (from scanned QR code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
    }
  }, []);

  const handleShuffleAvatar = () => {
    const remaining = AVATAR_PERSONAS.filter(p => p.id !== selectedPersona.id);
    const random = remaining[Math.floor(Math.random() * remaining.length)];
    setSelectedPersona(random);
  };

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (localNameError) setLocalNameError(null);
    if (error) clearError();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    // Validate name upfront
    if (nickname.trim()) {
      const validation = validateParticipantName(nickname.trim());
      if (!validation.isValid) {
        setLocalNameError(validation.error || 'Nama tidak valid.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await joinRoom(
        roomCode.trim(),
        nickname.trim() || selectedPersona.name,
        selectedPersona.emoji,
        selectedPersona.bgColor
      );
      if (onJoined) onJoined();
    } catch {
      // Handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickJoinDemo = (code: string) => {
    setRoomCode(code);
  };

  return (
    <div className="w-full max-w-md mx-auto px-3.5 py-5 sm:py-7 flex flex-col justify-center animate-in fade-in duration-300">
      
      {/* Brand & Greeting Header */}
      <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
        <BrandLogo size="md" showText={false} className="mb-2" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Join Live Polling
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
          Pilih karaktermu & masukkan kode PIN untuk voting langsung.
        </p>
      </div>

      {/* Main Join Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-6 space-y-4">
        
        {(error || localNameError) && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{localNameError || error}</span>
            </div>
            <button 
              onClick={() => { clearError(); setLocalNameError(null); }} 
              className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          
          {/* Room Code Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Code (PIN)
            </label>
            <input
              id="participant-room-code-input"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. PULSE88"
              maxLength={10}
              required
              autoFocus
              autoComplete="off"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xl sm:text-2xl font-black tracking-widest text-slate-900 text-center uppercase focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:text-sm font-mono-numbers"
            />
          </div>

          {/* Nickname Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Nama Kamu <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              <span className={`text-[10px] font-mono ${nickname.length >= 18 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {nickname.length}/20
              </span>
            </div>
            <input
              id="participant-name-input"
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder={`e.g. ${selectedPersona.name} (Bebas spasi & angka)`}
              maxLength={20}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none transition-all ${
                localNameError ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50'
              }`}
            />
          </div>

          {/* DELIGHTFUL AVATAR PERSONA PICKER */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <span>Pilih Karakter Avatar</span>
                <Sparkles className="w-3 h-3 text-indigo-600" />
              </label>
              
              {/* Shuffle / Randomize Button */}
              <button
                type="button"
                onClick={handleShuffleAvatar}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                title="Acak avatar kamu"
              >
                <Shuffle className="w-3 h-3" />
                <span>Acak 🎲</span>
              </button>
            </div>

            {/* Live Character Preview Pill */}
            <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPersona.bgGradient} flex items-center justify-center text-xl shadow-xs shrink-0 animate-bounce duration-1000`}>
                  {selectedPersona.emoji}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 truncate">
                    <span>{nickname.trim() || selectedPersona.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({selectedPersona.name})</span>
                  </div>
                  <div className="text-[10px] font-semibold text-indigo-600 truncate">
                    {selectedPersona.tagline}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                Terpilih ✓
              </span>
            </div>

            {/* 12 Mascot Personas Grid */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {AVATAR_PERSONAS.map((persona) => {
                const isSelected = selectedPersona.id === persona.id;
                return (
                  <button
                    type="button"
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`relative p-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 ring-2 ring-indigo-600 scale-105 shadow-sm border border-indigo-200'
                        : 'bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 active:scale-95'
                    }`}
                    title={`${persona.name} • ${persona.tagline}`}
                  >
                    {/* Glowing Avatar Squircle */}
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${persona.bgGradient} flex items-center justify-center text-base shadow-2xs transition-transform ${isSelected ? 'scale-110' : ''}`}>
                      {persona.emoji}
                    </div>

                    <span className={`text-[9px] font-bold mt-1 truncate max-w-full leading-tight ${
                      isSelected ? 'text-indigo-900 font-black' : 'text-slate-600'
                    }`}>
                      {persona.name}
                    </span>

                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xs ring-1 ring-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enter Room Button */}
          <button
            id="participant-join-submit-btn"
            type="submit"
            disabled={isSubmitting || !roomCode.trim()}
            className="w-full mt-2 py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-white" />
                <span className="tracking-wide">Menghubungkan...</span>
              </span>
            ) : (
              <>
                <span>Masuk & Mulai Voting</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature badges */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scan QR di panggung</span>
          </div>
          <div className="flex items-center space-x-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instan & Anonim</span>
          </div>
        </div>
      </div>

      {/* Suggested Active Room Quick Join */}
      {currentEvent && !roomCode && (
        <div 
          onClick={() => handleQuickJoinDemo(currentEvent.roomCode)}
          className="mt-3 p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100/90 rounded-2xl text-center cursor-pointer transition-colors group"
        >
          <p className="text-xs text-slate-600">
            Sesi aktif: <strong className="text-indigo-700 font-mono font-bold group-hover:underline">{currentEvent.roomCode}</strong> (klik untuk pasang PIN)
          </p>
        </div>
      )}
    </div>
  );
};
