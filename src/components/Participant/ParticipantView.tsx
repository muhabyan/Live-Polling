import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { ParticipantJoin } from './ParticipantJoin';
import { ParticipantWaiting } from './ParticipantWaiting';
import { ParticipantLiveQuestion } from './ParticipantLiveQuestion';
import { ParticipantSubmitted } from './ParticipantSubmitted';
import { ParticipantTicker } from './ParticipantTicker';
import { Smartphone, Maximize2, Minimize2, Trophy, RotateCcw } from 'lucide-react';

export const ParticipantView: React.FC = () => {
  const { currentEvent, currentParticipant } = useEvent();
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
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
        <div className="w-full max-w-md mx-auto p-6 text-center flex flex-col justify-center min-h-[calc(100vh-6rem)]">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
            <div className="w-16 h-16 rounded-xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              Session Completed!
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Thank you for actively participating in <strong className="text-slate-800">{currentEvent.title}</strong>.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Your Total Score
              </div>
              <div className="text-3xl font-semibold text-amber-600">
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
    <div className="py-6 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)]">
      
      {/* Device Mode Toggle bar */}
      <div className="mb-4 flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-600">
        <Smartphone className="w-4 h-4 text-indigo-600" />
        <span>Mobile Viewport Simulator</span>
        <div className="h-3.5 w-px bg-slate-200 mx-1" />
        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center space-x-1 text-slate-700 hover:text-indigo-900 font-semibold"
        >
          {isPhoneFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand to Full Width</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Phone Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Simulator Wrapper */}
      {isPhoneFrame ? (
        <div className="relative w-full max-w-[420px] bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800">
          {/* Top Speaker Notch */}
          <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
            <div className="w-8 h-1.5 bg-slate-700 rounded-full" />
          </div>
          {/* Screen Glass */}
          <div className="relative w-full bg-[#F8FAFC] rounded-[32px] overflow-hidden min-h-[640px] max-h-[780px] overflow-y-auto shadow-inner pb-10">
            {renderContent()}
            {currentParticipant && <ParticipantTicker />}
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-2xl bg-[#F8FAFC] rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md min-h-[500px] overflow-hidden pb-12">
          {renderContent()}
          {currentParticipant && <ParticipantTicker />}
        </div>
      )}
    </div>
  );
};
