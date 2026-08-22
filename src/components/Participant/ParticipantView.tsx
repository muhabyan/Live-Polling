import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { ParticipantJoin } from './ParticipantJoin';
import { ParticipantWaiting } from './ParticipantWaiting';
import { ParticipantLiveQuestion } from './ParticipantLiveQuestion';
import { ParticipantSubmitted } from './ParticipantSubmitted';
import { ParticipantTicker } from './ParticipantTicker';
import { ParticipantCompanion } from './ParticipantCompanion';
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
      const hasQuizScoring = currentEvent.isQuizMode || currentEvent.questions.some(q => (q.points || 0) > 0 || (q.options || []).some(o => o.isCorrect));
      const myAnswersCount = currentEvent.responses.filter(r => r.participantId === currentParticipant.id).length;

      return (
        <div className="w-full max-w-md mx-auto p-4 sm:p-6 text-center flex flex-col justify-center my-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2 font-display">
              Session Selesai!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-5">
              Terima kasih telah berpartisipasi dalam <strong className="text-slate-800">{currentEvent.title}</strong>.
            </p>
            
            {hasQuizScoring ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl mb-5">
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">
                  Skor Quiz Kamu
                </div>
                <div className="text-3xl font-extrabold text-amber-600 font-mono-numbers">
                  {currentParticipant.score || 0} pts
                </div>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl mb-5">
                <div className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider mb-1">
                  Kontribusi Partisipasi Kamu
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono-numbers">
                  {myAnswersCount} / {currentEvent.questions.length} Soal Terjawab
                </div>
                <p className="text-[11px] text-indigo-500 mt-1">✓ Jawaban kamu tersimpan & terhitung secara live</p>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Sesi presentasi telah berakhir. Kamu dapat menutup tab ini.
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
    <div className="w-full flex-1 flex flex-col items-center justify-between pb-safe relative">
      {/* Top Companion HUD Bar */}
      {currentParticipant && (
        <ParticipantCompanion hasSubmitted={hasSubmittedCurrentQuestion} />
      )}

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {renderContent()}
      </div>

      {currentParticipant && <ParticipantTicker />}
    </div>
  );
};
