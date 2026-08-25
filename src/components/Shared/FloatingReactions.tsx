import React from 'react';
import { useEvent } from '../../context/EventContext';

export const FloatingReactions: React.FC = () => {
  const { currentEvent } = useEvent();
  const reactions = currentEvent?.reactions || [];

  // Show only recent reactions from last 4 seconds
  const recentReactions = reactions.filter(r => Date.now() - r.timestamp < 4000);

  if (recentReactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {recentReactions.map((reaction, index) => {
        // Pseudo random horizontal offset based on id
        const offset = ((reaction.timestamp % 80) + 10);
        return (
          <div
            key={reaction.id}
            className="absolute bottom-20 flex flex-col items-center animate-float-reaction"
            style={{
              left: `${(offset + (index * 12)) % 85 + 5}%`,
            }}
          >
            <span className="text-4xl filter drop-shadow-md select-none">
              {reaction.emoji}
            </span>
            {reaction.senderName && (
              <span className="neo-badge bg-[#1E1E1E] text-white text-[10px] mt-1 font-mono">
                {reaction.senderName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
