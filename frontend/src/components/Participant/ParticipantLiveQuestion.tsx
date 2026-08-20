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
  AlertCircle,
  Sparkles,
  HelpCircle
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

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 30;
  const isLocked = currentEvent?.isVotingLocked || timerRemaining === 0;

  const optionLetterMap = ['A', 'B', 'C', 'D', 'E', 'F'];
  const optionColorStyles = [
    { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', light: 'bg-indigo-50' },
    { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', light: 'bg-emerald-50' },
    { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', light: 'bg-amber-50' },
    { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600', light: 'bg-violet-50' },
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

  // Timer urgency color
  const getTimerBadgeStyle = () => {
    if (timerRemaining <= 5) return 'bg-rose-500 text-white animate-pulse';
    if (timerRemaining <= 15) return 'bg-amber-500 text-white';
    return 'bg-slate-800 text-white';
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col justify-between min-h-[calc(100vh-6rem)]">
      
      {/* Top Header: Progress & Live Countdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Question {questionNumber} of {totalQuestions}
            </span>
            {question.points && (
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                +{question.points} pts
              </span>
            )}
          </div>

          {/* Countdown Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-black font-mono shadow-xs transition-colors ${getTimerBadgeStyle()}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>00:{timerRemaining < 10 ? `0${timerRemaining}` : timerRemaining}</span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-6">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Title & Subtitle */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
            {question.title}
          </h2>
          {question.subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              {question.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Interactive Question Inputs based on Type */}
      <div className="my-auto py-2">
        
        {/* TYPE 1: MULTIPLE CHOICE */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
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
                  className={`w-full text-left p-4 rounded-xl border border-slate-200 transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                      : 'bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.99]'}`}
                >
                  <div className="flex items-center space-x-3.5 pr-2">
                    <div 
                      className={`w-8 h-8 rounded-lg font-semibold flex items-center justify-center text-sm shrink-0 shadow-sm ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : `${color.bg} text-white group-hover:scale-105 transition-transform`
                      }`}
                    >
                      {optionLetterMap[idx] || idx + 1}
                    </div>
                    <span className={`text-sm sm:text-base font-medium ${isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-800'}`}>
                      {opt.text}
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 2: TRUE / FALSE */}
        {question.type === 'true_false' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  className={`p-6 rounded-xl border border-slate-200 transition-all flex flex-col items-center text-center justify-center shadow-sm ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-semibold mb-3 shadow-sm ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {isTrue ? '✓' : '✕'}
                  </div>
                  <span className={`text-base font-medium ${
                    isSelected 
                      ? 'text-indigo-900'
                      : 'text-slate-800'
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>Submit 1 or 2 keywords</span>
            </div>
            <input
              id="word-cloud-input"
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="e.g. Innovation, Empathy"
              maxLength={40}
              disabled={isLocked}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-medium text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-base shadow-sm"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
              <span>Short words display best on the big screen</span>
              <span>{textAnswer.length}/40</span>
            </div>
          </div>
        )}

        {/* TYPE 4: RATING SCALE */}
        {question.type === 'rating' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              <span>{question.ratingMinLabel || '1 = Low'}</span>
              <span>{question.ratingMaxLabel || '5 = High'}</span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = ratingValue === num;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setRatingValue(num)}
                    className={`py-4 rounded-xl border font-semibold text-xl flex flex-col items-center justify-center transition-all shadow-sm ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white scale-105'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    <span>{num}</span>
                    <Star className={`w-3.5 h-3.5 mt-1 ${isSelected ? 'fill-slate-200 text-slate-200' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>

            {ratingValue && (
              <div className="text-center mt-4 text-xs font-semibold text-slate-700 bg-slate-100 py-1.5 rounded-lg border border-slate-200">
                Selected rating: {ratingValue} out of 5
              </div>
            )}
          </div>
        )}

        {/* TYPE 5: OPEN TEXT */}
        {question.type === 'open_text' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <textarea
              id="open-text-input"
              rows={4}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your response here..."
              maxLength={280}
              disabled={isLocked}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-none transition-all resize-none shadow-sm"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
              <span>Visible to moderator</span>
              <span>{textAnswer.length}/280 characters</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Submit Action or Lock Notice */}
      <div className="pt-4">
        {isLocked ? (
          <div className="w-full py-3.5 px-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Voting is closed for this question</span>
          </div>
        ) : (
          <button
            id="participant-submit-answer-btn"
            type="button"
            onClick={() => handleSubmit()}
            disabled={
              isSubmitting ||
              (question.type === 'multiple_choice' && selectedOptionIds.length === 0) ||
              (question.type === 'true_false' && selectedOptionIds.length === 0) ||
              ((question.type === 'word_cloud' || question.type === 'open_text') && !textAnswer.trim()) ||
              (question.type === 'rating' && ratingValue === null)
            }
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-medium rounded-lg text-base shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-5 h-5" color="text-white" />
                <span className="animate-pulse tracking-wider">RECORDING VOTE</span>
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
