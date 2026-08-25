import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { QrCode, ArrowRight, ShieldCheck, Shuffle, Sparkles, Check, AlertCircle } from 'lucide-react';
import { ButtonSpinner } from '../Shared/Loaders';
import { BrandLogo } from '../Shared/BrandLogo';
import { PikteraMascot } from '../Shared/PikteraMascot';
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
  { id: 'piktera', emoji: '🤖', name: 'Piktera', tagline: 'Maskot Utama Piktera', bgGradient: 'from-blue-600 to-indigo-800', bgColor: '#2F36C9' },
  { id: 'fox', emoji: '🦊', name: 'Fox', tagline: 'Cerdik & Cepat', bgGradient: 'from-amber-500 to-orange-600', bgColor: '#EA580C' },
  { id: 'panda', emoji: '🐼', name: 'Panda', tagline: 'Santai & Fokus', bgGradient: 'from-emerald-500 to-teal-700', bgColor: '#0D9488' },
  { id: 'lion', emoji: '🦁', name: 'Lion', tagline: 'Pemberani & Tegas', bgGradient: 'from-amber-400 to-amber-600', bgColor: '#D97706' },
  { id: 'cat', emoji: '🐱', name: 'Neko', tagline: 'Kreatif & Lincah', bgGradient: 'from-rose-400 to-pink-600', bgColor: '#FF1784' },
  { id: 'shiba', emoji: '🐶', name: 'Shiba', tagline: 'Setia & Ramah', bgGradient: 'from-orange-400 to-amber-500', bgColor: '#F59E0B' },
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
      await joinRoom(roomCode.trim(), nickname.trim() || selectedPersona.name, selectedPersona.emoji, selectedPersona.bgColor);
      onJoined?.();
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
    <div className="w-full max-w-md mx-auto px-3.5 py-5 sm:py-7 flex flex-col justify-center">
      
      {/* Brand & Greeting Header with Piktera Mascot */}
      <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
        <div className="mb-2">
          <PikteraMascot size="sm" mood="happy" headOnly={false} />
        </div>
        <BrandLogo size="lg" showText={true} className="justify-center" />
        <p className="text-xs text-gray-600 mt-2 max-w-xs mx-auto font-mono font-bold">
          Pilih karaktermu & masukkan kode PIN untuk voting langsung.
        </p>
      </div>

      {/* Main Join Card */}
      <div className="neo-card p-4 sm:p-6 space-y-4">
        
        {(error || localNameError) && (
          <div className="p-3 bg-[#FF1784] border-2 border-[#000000] rounded-lg text-white text-xs font-bold flex items-center justify-between" style={{ boxShadow: '2px 2px 0px #000000' }}>
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localNameError || error}</span>
            </div>
            <button 
              onClick={() => { clearError(); setLocalNameError(null); }} 
              className="font-black ml-2 hover:opacity-70 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          
          {/* Room Code Field */}
          <div>
            <label className="block text-[11px] font-black text-[#000000] uppercase tracking-wider mb-1.5 font-mono">
              Room Code (PIN)
            </label>
            <input
              id="participant-room-code-input"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. PIK88"
              maxLength={10}
              required
              autoFocus
              autoComplete="off"
              className="neo-input w-full text-xl sm:text-2xl font-black tracking-widest text-center uppercase font-mono placeholder:text-gray-400 placeholder:normal-case placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
            />
          </div>

          {/* Nickname Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black text-[#000000] uppercase tracking-wider font-mono">
                Nama Kamu <span className="text-gray-400 font-normal lowercase">(opsional)</span>
              </label>
              <span className={`text-[10px] font-mono font-bold ${nickname.length >= 18 ? 'text-[#FF1784]' : 'text-gray-400'}`}>
                {nickname.length}/20
              </span>
            </div>
            <input
              id="participant-name-input"
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder={`e.g. ${selectedPersona.name}`}
              maxLength={20}
              className={`neo-input w-full text-sm ${
                localNameError ? 'border-[#FF1784] bg-red-50' : ''
              }`}
            />
          </div>

          {/* AVATAR PERSONA PICKER */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-black text-[#000000] uppercase tracking-wider font-mono flex items-center space-x-1">
                <span>Pilih Avatar</span>
                <Sparkles className="w-3 h-3 text-[#2F36C9]" />
              </label>
              
              <button
                type="button"
                onClick={handleShuffleAvatar}
                className="neo-btn bg-[#C1FF33] text-[#000000] text-[10px] px-2 py-0.5"
                title="Acak avatar kamu"
              >
                <Shuffle className="w-3 h-3" />
                <span>Acak 🎲</span>
              </button>
            </div>

            {/* Live Character Preview */}
            <div className="mb-3 p-2.5 border-2 border-[#000000] rounded-lg bg-[#FFF8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-[#000000] flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: selectedPersona.bgColor, boxShadow: '2px 2px 0px #000000' }}
                >
                  {selectedPersona.emoji}
                </div>
                <div className="truncate">
                  <div className="text-xs font-black text-[#000000] flex items-center space-x-1.5 truncate">
                    <span>{nickname.trim() || selectedPersona.name}</span>
                    <span className="text-[10px] text-gray-500 font-normal font-mono">({selectedPersona.name})</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#2F36C9] truncate font-mono">
                    {selectedPersona.tagline}
                  </div>
                </div>
              </div>
              <span className="neo-badge bg-[#C1FF33] text-[#000000] shrink-0">
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
                    className={`relative p-1.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'border-[#2F36C9] bg-[#2F36C9]/10 shadow-[2px_2px_0px_#2F36C9] scale-105'
                        : 'border-[#000000] bg-white hover:bg-[#C1FF33]/30 active:scale-95'
                    }`}
                    title={`${persona.name} • ${persona.tagline}`}
                  >
                    <div
                      className="w-8 h-8 rounded-md border-2 border-[#000000] flex items-center justify-center text-base"
                      style={{ backgroundColor: persona.bgColor }}
                    >
                      {persona.emoji}
                    </div>

                    <span className={`text-[9px] font-bold mt-1 truncate max-w-full leading-tight ${
                      isSelected ? 'text-[#2F36C9] font-black' : 'text-[#000000]'
                    }`}>
                      {persona.name}
                    </span>

                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#2F36C9] text-white rounded-md flex items-center justify-center border-2 border-[#000000]">
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
            className="neo-btn w-full mt-2 py-3.5 px-5 bg-[#C1FF33] text-[#000000] font-black text-sm sm:text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-[#000000]" />
                <span className="tracking-wide font-mono">Menghubungkan...</span>
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
        <div className="mt-4 pt-3.5 border-t-2 border-[#000000]/10 flex items-center justify-between text-[11px] text-gray-700 font-bold">
          <div className="flex items-center space-x-1.5">
            <QrCode className="w-3.5 h-3.5 text-[#2F36C9]" />
            <span>Scan QR di panggung</span>
          </div>
          <div className="flex items-center space-x-1 text-[#2F36C9] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instan & Anonim</span>
          </div>
        </div>
      </div>

      {/* Suggested Active Room Quick Join */}
      {currentEvent && !roomCode && (
        <div 
          onClick={() => handleQuickJoinDemo(currentEvent.roomCode)}
          className="mt-3 p-3 neo-card-sm bg-[#C1FF33]/20 text-center cursor-pointer hover:bg-[#C1FF33]/40 transition-colors"
        >
          <p className="text-xs text-[#000000] font-bold font-mono">
            Sesi aktif: <strong className="underline decoration-2">{currentEvent.roomCode}</strong> (klik untuk pasang PIN)
          </p>
        </div>
      )}
    </div>
  );
};
