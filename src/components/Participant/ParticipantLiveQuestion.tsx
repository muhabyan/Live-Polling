import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Question } from '../../types';
import { ButtonSpinner } from '../Shared/Loaders';
import { 
  Clock, 
  Send, 
  Lock, 
  CheckCircle2, 
  Star, 
  Sparkles,
  HelpCircle,
  Check
} from 'lucide-react';

interface ParticipantLiveQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmitted: () => void;
}

export const ParticipantLiveQuestion: React.FC<ParticipantLiveQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSubmitted,
}) => {
  const { currentEvent, submitAnswer } = useEvent();
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Reset state when question changes
  useEffect(() => {
    setSelectedOptionIds([]);
    setTextAnswer('');
    setRatingValue(null);
    setIsSubmitting(false);
  }, [question.id]);

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? (question.timerSeconds || 45);
  const isLocked = currentEvent?.isVotingLocked || timerRemaining === 0;

  const optionLetterMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  // Distinct high-contrast brand colors for options (like Slido & Mentimeter)
  const optionColorStyles = [
    { bg: 'bg-indigo-600', text: 'text-white', badge: 'bg-indigo-100 text-indigo-800' },
    { bg: 'bg-teal-600', text: 'text-white', badge: 'bg-teal-100 text-teal-800' },
    { bg: 'bg-amber-600', text: 'text-white', badge: 'bg-amber-100 text-amber-800' },
    { bg: 'bg-rose-600', text: 'text-white', badge: 'bg-rose-100 text-rose-800' },
    { bg: 'bg-purple-600', text: 'text-white', badge: 'bg-purple-100 text-purple-800' },
    { bg: 'bg-sky-600', text: 'text-white', badge: 'bg-sky-100 text-sky-800' },
  ];

  const handleOptionToggle = (optionId: string) => {
    if (isLocked) return;
    if (question.allowMultiple) {
      setSelectedOptionIds(prev => 
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked || isSubmitting) return;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    setIsSubmitting(true);
    try {
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (selectedOptionIds.length === 0) return;
        await submitAnswer({
          questionId: question.id,
          selectedOptionIds,
          timeTakenSeconds: timeTaken,
        });
      } else if (question.type === 'word_cloud' || question.type === 'open_text') {
        if (!textAnswer.trim()) return;
        await submitAnswer({
          questionId: question.id,
          textResponse: textAnswer.trim(),
          timeTakenSeconds: timeTaken,
        });
      } else if (question.type === 'rating') {
        if (ratingValue === null) return;
        await submitAnswer({
          questionId: question.id,
          ratingValue,
          timeTakenSeconds: timeTaken,
        });
      }
      onAnswerSubmitted();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      return selectedOptionIds.length > 0;
    }
    if (question.type === 'word_cloud' || question.type === 'open_text') {
      return textAnswer.trim().length > 0;
    }
    if (question.type === 'rating') {
      return ratingValue !== null;
    }
    return false;
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4 sm:p-6 flex flex-col justify-between flex-1">
      
      {/* Top Header: Progress & Live Countdown */}
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              Q {questionNumber} / {totalQuestions}
            </span>
            {question.allowMultiple && (
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Select multiple
              </span>
            )}
            {question.points ? (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                +{question.points} pts
              </span>
            ) : null}
          </div>

          {/* Countdown Badge */}
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono-numbers shadow-2xs transition-colors ${
            timerRemaining <= 5 
              ? 'bg-rose-600 text-white animate-pulse' 
              : timerRemaining <= 15 
              ? 'bg-amber-500 text-white' 
              : 'bg-slate-800 text-white'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{timerRemaining}s</span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4 sm:mb-5">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Title & Subtitle */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight font-display">
            {question.title}
          </h2>
          {question.subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {question.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Interactive Question Inputs */}
      <div className="my-auto py-2">
        
        {/* TYPE 1: MULTIPLE CHOICE */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-2.5 sm:space-y-3">
            {(question.options || []).map((opt, idx) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              const color = optionColorStyles[idx % optionColorStyles.length];

              return (
                <button
                  key={opt.id}
                  id={`participant-opt-${opt.id}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleOptionToggle(opt.id)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-600/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                >
                  <div className="flex items-center space-x-3 pr-2 min-w-0">
                    <div 
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 transition-transform ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : `${color.bg} text-white`
                      }`}
                    >
                      {optionLetterMap[idx] || idx + 1}
                    </div>
                    <span className={`text-sm sm:text-base font-semibold leading-snug ${
                      isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                    }`}>
                      {opt.text}
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white scale-105' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 2: TRUE / FALSE */}
        {question.type === 'true_false' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(question.options || [
              { id: 'tf-true', text: 'True' },
              { id: 'tf-false', text: 'False' }
            ]).map((opt, idx) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              const isTrue = opt.text.toLowerCase().includes('true');

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleOptionToggle(opt.id)}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col items-center text-center justify-center cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold mb-2 shadow-2xs ${
                    isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : isTrue 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-rose-600 text-white'
                  }`}>
                    {isTrue ? '✓' : '✕'}
                  </div>
                  <span className={`text-base font-bold ${
                    isSelected ? 'text-indigo-950' : 'text-slate-800'
                  }`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 3: WORD CLOUD */}
        {question.type === 'word_cloud' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Submit 1 or 2 keywords</span>
            </div>
            <input
              id="word-cloud-input"
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type keyword e.g. Innovation"
              maxLength={40}
              disabled={isLocked}
              autoFocus
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-lg font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-sm"
            />
            <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
              <span>Will appear live on the big stage</span>
              <span className="font-mono-numbers">{textAnswer.length}/40</span>
            </div>
          </div>
        )}

        {/* TYPE 4: RATING SCALE */}
        {question.type === 'rating' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              <span>{question.ratingMinLabel || '1 (Low)'}</span>
              <span>{question.ratingMaxLabel || '5 (High)'}</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = ratingValue === num;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setRatingValue(num)}
                    className={`py-3.5 sm:py-4 rounded-xl border font-bold text-lg sm:text-xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white scale-105 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    <span>{num}</span>
                    <Star className={`w-3.5 h-3.5 mt-1 ${isSelected ? 'fill-white text-white' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>

            {ratingValue && (
              <div className="text-center mt-3 text-xs font-bold text-indigo-700 bg-indigo-50 py-1.5 rounded-lg border border-indigo-100 animate-in fade-in">
                Selected rating: {ratingValue} / 5
              </div>
            )}
          </div>
        )}

        {/* TYPE 5: OPEN TEXT */}
        {question.type === 'open_text' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <textarea
              id="open-text-input"
              rows={3}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your response here..."
              maxLength={280}
              disabled={isLocked}
              autoFocus
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition-all resize-none placeholder:text-slate-400"
            />
            <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400">
              <span>Submitted live to moderator</span>
              <span className="font-mono-numbers">{textAnswer.length}/280</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Submit Action */}
      <div className="pt-3">
        {isLocked ? (
          <div className="w-full py-3.5 px-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Voting is closed for this question</span>
          </div>
        ) : (
          <button
            id="participant-submit-answer-btn"
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !isFormValid()}
            className="w-full py-3.5 sm:py-4 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-white" />
                <span className="tracking-wide">Submitting Vote...</span>
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
