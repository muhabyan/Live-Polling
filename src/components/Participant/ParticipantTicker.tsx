import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, MessageSquare, Zap, Activity, Heart } from 'lucide-react';

export const ParticipantTicker: React.FC = () => {
  const { currentEvent } = useEvent();
  const [tickerIndex, setTickerIndex] = useState(0);

  const participantsCount = currentEvent?.participants.length || 0;
  const responsesCount = currentEvent?.responses.length || 0;
  const totalReactions = currentEvent?.reactions?.length || 0;

  const tickerItems = [
    { icon: <Users className="w-3.5 h-3.5 text-indigo-600" />, text: `${participantsCount} connected live` },
    { icon: <MessageSquare className="w-3.5 h-3.5 text-teal-600" />, text: `${responsesCount} votes recorded` },
    { icon: <Heart className="w-3.5 h-3.5 text-rose-500" />, text: `${totalReactions} stage cheers` },
    { icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, text: `Interactive live session 🔥` },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  return (
    <div className="w-full py-2 px-4 bg-slate-100/80 border-t border-slate-200/80 flex items-center justify-center shrink-0">
      <div 
        className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 animate-slide-up-fade"
        key={tickerIndex}
      >
        {tickerItems[tickerIndex].icon}
        <span>{tickerItems[tickerIndex].text}</span>
      </div>
    </div>
  );
};
