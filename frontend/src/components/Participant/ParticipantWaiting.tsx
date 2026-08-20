import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, Clock, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

export const ParticipantWaiting: React.FC = () => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();

  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '✨', '🎉'];

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-between min-h-[calc(100vh-6rem)]">
      
      {/* Top Participant Status */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white shadow-xs"
            style={{ backgroundColor: currentParticipant?.avatarBg || '#2563EB' }}
          >
            {currentParticipant?.avatarEmoji || '👋'}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <span>{currentParticipant?.name || 'Attendee'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Connected & Ready
            </div>
          </div>
        </div>

        <button
          onClick={leaveRoom}
          className="text-xs text-slate-400 hover:text-rose-600 flex items-center space-x-1 font-medium transition-colors"
          title="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Main Waiting Card */}
      <div className="my-auto py-8 text-center bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* Pulsing Animated Wave Radar */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full bg-indigo-200/40 animate-pulse" />
          <div className="relative w-16 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm font-bold text-2xl">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 mb-3">
          Waiting Room
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 mb-2 leading-snug">
          {currentEvent?.title || 'Waiting for Session to Begin'}
        </h2>

        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
          The moderator will start the interactive questions shortly. Keep this screen open!
        </p>

        {/* Live Participant Counter */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="font-mono-numbers font-semibold text-slate-800">
            {currentEvent?.participants.length || 1}
          </span>
          <span className="text-slate-500">participants in the room</span>
        </div>
      </div>

      {/* Tap to Cheer / Live Reactions Dock */}
      <div className="bg-white/90 backdrop-blur-xs border border-slate-200 rounded-xl p-4 text-center shadow-sm">
        <div className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center justify-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Tap to send reactions to the main stage</span>
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-125 hover:scale-110 transition-all text-xl flex items-center justify-center shadow-sm border border-slate-200"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
