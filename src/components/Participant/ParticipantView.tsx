import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { ParticipantJoin } from './ParticipantJoin';
import { ParticipantWaiting } from './ParticipantWaiting';
import { ParticipantLiveQuestion } from './ParticipantLiveQuestion';
import { ParticipantSubmitted } from './ParticipantSubmitted';
import { ParticipantTicker } from './ParticipantTicker';
import { ParticipantCompanion } from './ParticipantCompanion';
import { Trophy, LogOut } from 'lucide-react';

export const ParticipantView: React.FC = () => {
  const { currentEvent, currentParticipant, leaveRoom } = useEvent();
  const [hasSubmittedCurrentQuestion, setHasSubmittedCurrentQuestion] = useState(false);
  const [revotingQuestionId, setRevotingQuestionId] = useState<string | null>(null);

  // Reset revote state whenever the presenter advances to a different question
  useEffect(() => {
    setRevotingQuestionId(null);
  }, [currentEvent?.currentQuestionIndex]);

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
      const hasQuizScoring = currentEvent.isQuizMode || currentEvent.questions.some(q => (q.points || 0) > 0 || (q.options || []).some(o => o.isCorrect));
      const myAnswersCount = currentEvent.responses.filter(r => r.participantId === currentParticipant.id).length;

      return (
        <div className="w-full max-w-md mx-auto p-3 sm:p-6 text-center flex flex-col justify-center my-auto gap-3">
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 text-xl sm:text-2xl shadow-xs">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 mb-1.5 sm:mb-2 font-display">
              Session Selesai!
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500 mb-4 sm:mb-5">
              Terima kasih telah berpartisipasi dalam <strong className="text-slate-800">{currentEvent.title}</strong>.
            </p>
            
            {hasQuizScoring ? (
              <div className="p-3 sm:p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl mb-4 sm:mb-5">
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">
                  Skor Quiz Kamu
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono-numbers">
                  {currentParticipant.score || 0} pts
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl mb-4 sm:mb-5">
                <div className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider mb-1">
                  Kontribusi Partisipasi Kamu
                </div>
                <div className="text-xl sm:text-3xl font-extrabold text-indigo-600 font-mono-numbers">
                  {myAnswersCount} / {currentEvent.questions.length} Soal Terjawab
                </div>
                <p className="text-[11px] text-indigo-500 mt-1">✓ Jawaban kamu tersimpan & terhitung secara live</p>
              </div>
            )}

            <p className="text-[11px] sm:text-xs text-slate-400 mb-4">
              Sesi presentasi telah berakhir. Kamu dapat menutup tab ini.
            </p>

            {/* Exit Room Button */}
            <button
              onClick={leaveRoom}
              className="w-full py-2.5 flex items-center justify-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200 hover:border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Room</span>
            </button>
          </div>
        </div>
      );
    }

    // 4. Live question screen
    const currentQ = currentEvent.questions[currentEvent.currentQuestionIndex];
    if (!currentQ) {
      return <ParticipantWaiting />;
    }

    const myResponse = currentEvent.responses.find(
      r => r.participantId === currentParticipant.id && r.questionId === currentQ.id
    );
    const hasAnswered = !!myResponse;
    const isRevoting = revotingQuestionId === currentQ.id;

    // If answer already submitted for this question and NOT in active revote mode -> show confirmation
    if (hasAnswered && !isRevoting) {
      return (
        <ParticipantSubmitted 
          onRevote={() => setRevotingQuestionId(currentQ.id)}
        />
      );
    }

    return (
      <ParticipantLiveQuestion
        question={currentQ}
        questionNumber={currentEvent.currentQuestionIndex + 1}
        totalQuestions={currentEvent.questions.length}
        initialResponse={myResponse}
        isRevoting={isRevoting}
        onAnswerSubmitted={() => {
          setRevotingQuestionId(null);
          setHasSubmittedCurrentQuestion(true);
        }}
      />
    );
  };

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 45;
  const isTimerRunning = currentEvent?.isTimerRunning;
  const isVotingLocked = currentEvent?.isVotingLocked || timerRemaining === 0;
  const isLiveQuestionState = currentEvent?.status === 'live' && currentParticipant && !hasSubmittedCurrentQuestion && !isVotingLocked;
  const isUrgentTimer = isLiveQuestionState && isTimerRunning && timerRemaining <= 10 && timerRemaining > 0;

  return (
    <div className="w-full flex-1 flex flex-col items-center pb-safe relative overflow-y-auto overflow-x-hidden">
      {/* Urgent Countdown Screen-Edge Red Pulse Alert (<10s & Not Answered) */}
      {isUrgentTimer && (
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-50 border-4 sm:border-8 border-rose-500 animate-danger-pulse transition-opacity duration-300"
        >
          {/* Top Urgency Pill Banner */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-[11px] px-3.5 py-1 rounded-full shadow-lg flex items-center space-x-1.5 animate-bounce ring-2 ring-white/80 select-none">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="tracking-wide font-mono-numbers">⏱ SISA {timerRemaining} DETIK LAGI!</span>
          </div>
        </div>
      )}

      {/* Top Companion HUD Bar */}
      {currentParticipant && (
        <ParticipantCompanion hasSubmitted={hasSubmittedCurrentQuestion} />
      )}

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0">
        {renderContent()}
      </div>

      {currentParticipant && <ParticipantTicker />}
    </div>
  );
};
