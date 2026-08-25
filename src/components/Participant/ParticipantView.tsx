import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { ParticipantJoin } from './ParticipantJoin';
import { ParticipantWaiting } from './ParticipantWaiting';
import { ParticipantLiveQuestion } from './ParticipantLiveQuestion';
import { ParticipantSubmitted } from './ParticipantSubmitted';
import { ParticipantTicker } from './ParticipantTicker';
import { ParticipantCompanion } from './ParticipantCompanion';
import { Trophy, LogOut } from 'lucide-react';
import { CharacterMascot } from '../Shared/CharacterMascot';

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
          <div className="neo-card p-5 sm:p-8 bg-white">
            <div className="flex justify-center mb-3 sm:mb-4">
              <CharacterMascot
                emoji={currentParticipant.avatarEmoji || '🤖'}
                bgColor={currentParticipant.avatarBg || '#2F36C9'}
                name={currentParticipant.name}
                size="md"
                mood="celebrating"
              />
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[#000000] mb-1.5 sm:mb-2 font-heading uppercase">
              Sesi Selesai!
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-600 mb-4 sm:mb-5 font-mono">
              Terima kasih telah berpartisipasi dalam <strong className="text-[#000000]">{currentEvent.title}</strong>.
            </p>
            
            {hasQuizScoring ? (
              <div className="p-3 sm:p-4 bg-[#FACC15]/20 border-2 border-[#1E1E1E] rounded-lg mb-4 sm:mb-5">
                <div className="text-[10px] text-[#1E1E1E] font-bold uppercase tracking-wider mb-1 font-mono">
                  Skor Quiz Kamu
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
                  {currentParticipant.score || 0} pts
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-[#4F46E5]/10 border-2 border-[#1E1E1E] rounded-lg mb-4 sm:mb-5">
                <div className="text-[10px] text-[#1E1E1E] font-bold uppercase tracking-wider mb-1 font-mono">
                  Kontribusi Partisipasi Kamu
                </div>
                <div className="text-xl sm:text-3xl font-black text-[#4F46E5] font-mono">
                  {myAnswersCount} / {currentEvent.questions.length} Soal Terjawab
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">✓ Jawaban kamu tersimpan & terhitung secara live</p>
              </div>
            )}

            <p className="text-[11px] sm:text-xs text-gray-400 mb-4">
              Sesi presentasi telah berakhir. Kamu dapat menutup tab ini.
            </p>

            {/* Exit Room Button */}
            <button
              onClick={leaveRoom}
              className="neo-btn w-full py-2.5 bg-white text-[#1E1E1E] text-xs font-bold hover:bg-[#FB7185]/20"
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
          className="fixed inset-0 pointer-events-none z-50 border-4 sm:border-8 border-[#FB7185] animate-danger-pulse transition-opacity duration-300"
        >
          {/* Top Urgency Pill Banner */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 neo-badge bg-[#FB7185] text-[#1E1E1E] px-3.5 py-1.5 text-[11px] animate-bounce select-none">
            <span className="w-2 h-2 rounded-full bg-[#1E1E1E] animate-ping" />
            <span className="tracking-wide font-mono">⏱ SISA {timerRemaining} DETIK LAGI!</span>
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
