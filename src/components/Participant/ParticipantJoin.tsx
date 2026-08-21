import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, QrCode, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ButtonSpinner } from '../Shared/Loaders';
import { BrandLogo } from '../Shared/BrandLogo';

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
  const [selectedEmoji, setSelectedEmoji] = useState('🚀');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojiOptions = ['🚀', '💡', '🎯', '⚡', '🌟', '🔥', '✨', '🧠', '🎉', '👋'];

  // Check URL query parameters for auto code (from scanned QR code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    setIsSubmitting(true);
    try {
      await joinRoom(roomCode.trim(), nickname.trim() || 'Attendee', selectedEmoji);
      if (onJoined) onJoined();
    } catch (err) {
      // Handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickJoinDemo = (code: string) => {
    setRoomCode(code);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
      
      {/* Brand & Greeting Header */}
      <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
        <BrandLogo size="md" showText={false} className="mb-2.5" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Join Live Polling
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Enter the room code from the presenter's screen to vote live.
        </p>
      </div>

      {/* Main Join Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-7">
        
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          
          {/* Room Code Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Code (PIN)
            </label>
            <div className="relative">
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
                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl sm:text-2xl font-bold tracking-widest text-slate-900 text-center uppercase focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:text-sm font-mono-numbers"
              />
            </div>
          </div>

          {/* Nickname Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="participant-name-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={24}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all"
            />
          </div>

          {/* Avatar Emoji Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pick Your Avatar
            </label>
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 scrollbar-none">
              {emojiOptions.slice(0, 8).map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 ${
                    selectedEmoji === emoji
                      ? 'bg-indigo-100 ring-2 ring-indigo-600 scale-105 shadow-2xs'
                      : 'bg-slate-100/80 hover:bg-slate-200 active:scale-95'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Join Button */}
          <button
            id="participant-join-submit-btn"
            type="submit"
            disabled={isSubmitting || !roomCode.trim()}
            className="w-full mt-2 py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-white" />
                <span className="tracking-wide">Joining Room...</span>
              </span>
            ) : (
              <>
                <span>Enter Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature badges */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scan QR on screen</span>
          </div>
          <div className="flex items-center space-x-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instant & Anonymous</span>
          </div>
        </div>
      </div>

      {/* Suggested Active Room Quick Join */}
      {currentEvent && !roomCode && (
        <div 
          onClick={() => handleQuickJoinDemo(currentEvent.roomCode)}
          className="mt-3 p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100/90 rounded-xl text-center cursor-pointer transition-colors group"
        >
          <p className="text-xs text-slate-600">
            Active session: <strong className="text-indigo-700 font-mono font-bold group-hover:underline">{currentEvent.roomCode}</strong> (klik untuk join)
          </p>
        </div>
      )}
    </div>
  );
};
