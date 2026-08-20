import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { ParticipantJoin } from './ParticipantJoin';
import { ParticipantWaiting } from './ParticipantWaiting';
import { ParticipantLiveQuestion } from './ParticipantLiveQuestion';
import { ParticipantSubmitted } from './ParticipantSubmitted';
import { ParticipantTicker } from './ParticipantTicker';
import { Trophy } from 'lucide-react';

export const ParticipantView: React.FC = () => {
  const { currentEvent, currentParticipant } = useEvent();
  const [hasSubmittedCurrentQuestion, setHasSubmittedCurrentQuestion] = useState(false);

  // Check if current participant already answered current question
  useEffect(() => {
    if (!currentEvent || !currentParticipant) {
      setHasSubmittedCurrentQuestion(false);
      return;
    }
    const currentQ = currentEvent.questions[currentEvent.currentQuestionIndex];
    if (!currentQ) {
      setHasSubmittedCurrentQuestion(false);
      return;
    }
    const alreadyAnswered = currentEvent.responses.some(
      r => r.participantId === currentParticipant.id && r.questionId === currentQ.id
    );
    setHasSubmittedCurrentQuestion(alreadyAnswered);
  }, [currentEvent, currentParticipant]);

  const renderContent = () => {
    // 1. Not joined yet -> Join screen
    if (!currentParticipant) {
      return <ParticipantJoin />;
    }

    // 2. Event is in waiting state -> Waiting room
    if (!currentEvent || currentEvent.status === 'waiting' || currentEvent.status === 'draft') {
      return <ParticipantWaiting />;
    }

    // 3. Event is ended -> Summary screen
    if (currentEvent.status === 'ended') {
      return (
        <div className="w-full max-w-md mx-auto p-6 text-center flex flex-col justify-center min-h-[60vh]">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 text-2xl shadow-md">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Session Completed!
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Thank you for actively participating in <strong className="text-slate-800">{currentEvent.title}</strong>.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Your Total Score
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {currentParticipant.score || 100} pts
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Results and analytics are exported by the organizer.
            </p>
          </div>
        </div>
      );
    }

    // 4. Live question screen
    const currentQ = currentEvent.questions[currentEvent.currentQuestionIndex];
    if (!currentQ) {
      return <ParticipantWaiting />;
    }

    // If answer already submitted for this question -> show confirmation
    if (hasSubmittedCurrentQuestion) {
      return (
        <ParticipantSubmitted 
          onRevote={() => setHasSubmittedCurrentQuestion(false)}
        />
      );
    }

    return (
      <ParticipantLiveQuestion
        question={currentQ}
        questionNumber={currentEvent.currentQuestionIndex + 1}
        totalQuestions={currentEvent.questions.length}
        onAnswerSubmitted={() => setHasSubmittedCurrentQuestion(true)}
      />
    );
  };

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center p-3 sm:p-6 relative">
      <div className="w-full max-w-lg mx-auto">
        {renderContent()}
        {currentParticipant && <ParticipantTicker />}
      </div>
    </div>
  );
};
