import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, Sparkles, LogOut } from 'lucide-react';
import { CharacterMascot } from '../Shared/CharacterMascot';

export const ParticipantWaiting: React.FC = () => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();

  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '✨', '🎉'];

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between flex-1 gap-3 min-h-0 overflow-y-auto">
      {/* Main Waiting Card with Animated Character Mascot */}
      <div className="my-auto py-5 sm:py-8 text-center neo-card p-4 sm:p-7 relative overflow-hidden shrink-0 bg-white">
        
        {/* Animated Full Character Mascot (Dragon, Fox, Panda, Piktera, etc.) */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <CharacterMascot
            emoji={currentParticipant?.avatarEmoji || '🤖'}
            bgColor={currentParticipant?.avatarBg || '#2F36C9'}
            name={currentParticipant?.name || 'Attendee'}
            size="md"
            mood="happy"
          />
        </div>

        <span className="neo-badge bg-[#FACC15] text-[#000000] mb-2 inline-flex font-mono">
          Lobby Waiting Room
        </span>

        <h2 className="text-base sm:text-xl font-black tracking-tight text-[#000000] mb-1 leading-snug font-heading uppercase">
          {currentEvent?.title || 'Waiting for Presenter to Begin'}
        </h2>

        <p className="text-[11px] sm:text-xs text-gray-600 max-w-xs mx-auto mb-3 sm:mb-5 font-mono">
          Karaktermu sedang bersiap! Soal akan otomatis muncul begitu presenter memulai sesi.
        </p>

        {/* Live Participant Counter */}
        <div className="neo-badge bg-[#FFF8F0] text-[#000000] text-xs inline-flex">
          <Users className="w-3.5 h-3.5 text-[#2F36C9]" />
          <span className="font-mono font-black">
            {currentEvent?.participants.length || 1}
          </span>
          <span className="text-gray-500 font-normal">participants connected</span>
        </div>
      </div>

      {/* Tap to Cheer / Live Reactions Dock */}
      <div className="neo-card p-3 sm:p-3.5 text-center shrink-0 bg-white">
        <div className="text-[11px] font-bold text-gray-600 mb-2 flex items-center justify-center space-x-1 font-mono">
          <Sparkles className="w-3 h-3 text-[#2F36C9]" />
          <span>Kirim reaksi live ke layar panggung</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-[#000000] bg-white hover:bg-[#C1FF33] active:scale-110 hover:scale-105 transition-all text-lg sm:text-xl flex items-center justify-center cursor-pointer"
              style={{ boxShadow: '2px 2px 0px #000000' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Exit Button */}
      <button
        onClick={leaveRoom}
        className="neo-btn w-full py-2.5 bg-white text-gray-500 hover:bg-[#FF1784] hover:text-white text-xs shrink-0 font-mono"
        title="Keluar dari room"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Keluar dari Room</span>
      </button>
    </div>
  );
};
