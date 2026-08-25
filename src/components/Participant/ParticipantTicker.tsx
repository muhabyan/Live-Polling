import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, MessageSquare, Zap, Heart } from 'lucide-react';

export const ParticipantTicker: React.FC = () => {
  const { currentEvent } = useEvent();
  const [tickerIndex, setTickerIndex] = useState(0);

  const participantsCount = currentEvent?.participants.length || 0;
  const responsesCount = currentEvent?.responses.length || 0;
  const totalReactions = currentEvent?.reactions?.length || 0;

  const tickerItems = [
    { icon: <Users className="w-3.5 h-3.5 text-[#4F46E5]" />, text: `${participantsCount} connected live` },
    { icon: <MessageSquare className="w-3.5 h-3.5 text-[#34D399]" />, text: `${responsesCount} votes recorded` },
    { icon: <Heart className="w-3.5 h-3.5 text-[#FB7185]" />, text: `${totalReactions} stage cheers` },
    { icon: <Zap className="w-3.5 h-3.5 text-[#FACC15]" />, text: `Interactive live session 🔥` },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  return (
    <div className="w-full py-2 px-4 bg-[#1E1E1E] border-t-2 border-[#1E1E1E] flex items-center justify-center shrink-0">
      <div 
        className="flex items-center space-x-1.5 text-[11px] font-bold text-white animate-slide-up-fade font-mono"
        key={tickerIndex}
      >
        {tickerItems[tickerIndex].icon}
        <span>{tickerItems[tickerIndex].text}</span>
      </div>
    </div>
  );
};
