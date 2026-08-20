import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, QrCode, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ButtonSpinner } from '../Shared/Loaders';

interface ParticipantJoinProps {
  onJoined?: () => void;
}

export const ParticipantJoin: React.FC<ParticipantJoinProps> = ({ onJoined }) => {
  const { currentEvent, joinRoom, error, clearError } = useEvent();
  const [roomCode, setRoomCode] = useState(currentEvent?.roomCode || '');
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🚀');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojiOptions = ['🚀', '💡', '🎯', '⚡', '🌟', '🔥', '✨', '🧠', '🎉', '👋'];

  // Check URL query parameters for auto code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
    } else if (currentEvent?.roomCode) {
      setRoomCode(currentEvent.roomCode);
    }
  }, [currentEvent]);

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

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-center min-h-[calc(100vh-5rem)]">
      
      {/* Brand & Greeting */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-md mb-3 ring-4 ring-blue-50">
          P
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Join Live Event
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Enter the room code from the presenter's screen to vote and interact in real time.
        </p>
      </div>

      {/* Main Join Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6 sm:p-8">
        
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          
          {/* Room Code Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Code
            </label>
            <div className="relative">
              <input
                id="participant-room-code-input"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. PULSE88"
                maxLength={10}
                required
                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-bold tracking-widest text-slate-900 text-center uppercase focus:bg-white focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:text-base font-mono"
              />
            </div>
          </div>

          {/* Nickname Field (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Name / Nickname <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="participant-name-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={24}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>

          {/* Avatar Emoji Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Choose Avatar
            </label>
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
              {emojiOptions.slice(0, 7).map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                    selectedEmoji === emoji
                      ? 'bg-blue-100 ring-2 ring-blue-600 scale-110 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 hover:scale-105'
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
            className="w-full mt-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-5 h-5" color="text-white" />
                <span className="animate-pulse tracking-wider">CONNECTING</span>
              </span>
            ) : (
              <>
                <span>Join Live Session</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* QR Scan Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Scan QR code from screen</span>
          </div>
          <div className="flex items-center space-x-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>No account required</span>
          </div>
        </div>
      </div>

      {/* Suggested Active Room Quick Join */}
      {currentEvent && (
        <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center">
          <p className="text-xs text-slate-600">
            Current active demonstration room: <strong className="text-blue-700 font-mono">{currentEvent.roomCode}</strong> ({currentEvent.title})
          </p>
        </div>
      )}
    </div>
  );
};
