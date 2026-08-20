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
    { icon: <Users className="w-3.5 h-3.5 text-indigo-500" />, text: `${participantsCount} connected globally` },
    { icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />, text: `${responsesCount} votes cast in this session` },
    { icon: <Heart className="w-3.5 h-3.5 text-rose-500" />, text: `${totalReactions} total reactions` },
    { icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, text: `Live engagement is trending high 🔥` },
    { icon: <Activity className="w-3.5 h-3.5 text-violet-500" />, text: `Analyzing real-time interactions...` },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-50/95 backdrop-blur-sm border-t border-slate-200/60 flex items-center justify-center overflow-hidden pointer-events-none shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
      <div 
        className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wider animate-slide-up-fade"
        key={tickerIndex}
      >
        {tickerItems[tickerIndex].icon}
        <span>{tickerItems[tickerIndex].text}</span>
      </div>
    </div>
  );
};
