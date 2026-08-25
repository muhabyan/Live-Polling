import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Question } from '../../types';
import { ButtonSpinner } from '../Shared/Loaders';
import { 
  Clock, 
  Send, 
  Lock, 
  Star, 
  Sparkles,
  Check
} from 'lucide-react';

interface ParticipantLiveQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  initialResponse?: any;
  isRevoting?: boolean;
  onAnswerSubmitted: () => void;
}

export const ParticipantLiveQuestion: React.FC<ParticipantLiveQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  initialResponse,
  isRevoting,
  onAnswerSubmitted,
}) => {
  const { currentEvent, submitAnswer } = useEvent();
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    initialResponse?.selectedOptionIds || []
  );
  const [textAnswer, setTextAnswer] = useState(
    initialResponse?.textResponse || ''
  );
  const [ratingValue, setRatingValue] = useState<number | null>(
    initialResponse?.ratingValue ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Reset or prefill state when question or initialResponse changes
  useEffect(() => {
    setSelectedOptionIds(initialResponse?.selectedOptionIds || []);
    setTextAnswer(initialResponse?.textResponse || '');
    setRatingValue(initialResponse?.ratingValue ?? null);
    setIsSubmitting(false);
  }, [question.id, initialResponse?.id]);

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? (question.timerSeconds || 45);
  const isLocked = currentEvent?.isVotingLocked || timerRemaining === 0;

  const optionLetterMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  // Neo-brutal vivid flat colors for options
  const optionNeoColors = [
    { bg: '#4F46E5', label: 'Indigo' },
    { bg: '#0D9488', label: 'Teal' },
    { bg: '#D97706', label: 'Amber' },
    { bg: '#E11D48', label: 'Rose' },
    { bg: '#7C3AED', label: 'Purple' },
    { bg: '#0284C7', label: 'Sky' },
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
    <div className="w-full max-w-md mx-auto px-3 py-3 sm:p-6 flex flex-col justify-between flex-1 min-h-0 overflow-y-auto">
      
      {/* Top Header: Progress & Live Countdown */}
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-2">
            <span className="neo-badge bg-white text-[#1E1E1E]">
              Q {questionNumber} / {totalQuestions}
            </span>
            {question.allowMultiple && (
              <span className="neo-badge bg-[#60A5FA] text-[#1E1E1E]">
                Select multiple
              </span>
            )}
            {question.points ? (
              <span className="neo-badge bg-[#FACC15] text-[#1E1E1E]">
                +{question.points} pts
              </span>
            ) : null}
          </div>

          {/* Countdown Badge */}
          <div className={`neo-badge font-mono text-xs py-1 ${
            timerRemaining <= 5 
              ? 'bg-[#FB7185] text-[#1E1E1E] animate-pulse' 
              : timerRemaining <= 15 
              ? 'bg-[#FACC15] text-[#1E1E1E]' 
              : 'bg-[#1E1E1E] text-white'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{timerRemaining}s</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white border-2 border-[#1E1E1E] h-3 rounded-md overflow-hidden mb-4 sm:mb-5">
          <div 
            className="bg-[#4F46E5] h-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Title */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-black text-[#1E1E1E] leading-snug tracking-tight font-display">
            {question.title}
          </h2>
          {question.subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
              const color = optionNeoColors[idx % optionNeoColors.length];

              return (
                <button
                  key={opt.id}
                  id={`participant-opt-${opt.id}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleOptionToggle(opt.id)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-lg border-2 border-[#1E1E1E] transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#4F46E5]/10 shadow-none translate-x-[2px] translate-y-[2px]'
                      : 'bg-white'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}
                  style={{ boxShadow: isSelected ? 'none' : '3px 3px 0px #1E1E1E' }}
                >
                  <div className="flex items-center space-x-3 pr-2 min-w-0">
                    <div 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-md border-2 border-[#1E1E1E] font-black flex items-center justify-center text-xs sm:text-sm shrink-0 text-white"
                      style={{ backgroundColor: isSelected ? '#4F46E5' : color.bg }}
                    >
                      {optionLetterMap[idx] || idx + 1}
                    </div>
                    <span className={`text-sm sm:text-base font-bold leading-snug ${
                      isSelected ? 'text-[#4F46E5] font-black' : 'text-[#1E1E1E]'
                    }`}>
                      {opt.text}
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? 'border-[#4F46E5] bg-[#4F46E5] text-white' : 'border-[#1E1E1E] bg-white'
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
            ]).map((opt) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              const isTrue = opt.text.toLowerCase().includes('true');

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleOptionToggle(opt.id)}
                  className={`p-5 sm:p-6 rounded-lg border-2 border-[#1E1E1E] transition-all flex flex-col items-center text-center justify-center cursor-pointer ${
                    isSelected
                      ? 'shadow-none translate-x-[2px] translate-y-[2px]'
                      : ''
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}
                  style={{
                    backgroundColor: isSelected ? (isTrue ? '#34D399' : '#FB7185') : '#FFFFFF',
                    boxShadow: isSelected ? 'none' : '4px 4px 0px #1E1E1E',
                  }}
                >
                  <div className={`w-11 h-11 rounded-lg border-2 border-[#1E1E1E] flex items-center justify-center text-lg font-black mb-2 ${
                    isSelected 
                      ? 'bg-white text-[#1E1E1E]' 
                      : isTrue 
                      ? 'bg-[#34D399] text-[#1E1E1E]' 
                      : 'bg-[#FB7185] text-[#1E1E1E]'
                  }`}>
                    {isTrue ? '✓' : '✕'}
                  </div>
                  <span className={`text-base font-black ${
                    isSelected ? 'text-[#1E1E1E]' : 'text-[#1E1E1E]'
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
          <div className="neo-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
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
              className="neo-input w-full text-base sm:text-lg"
            />
            <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
              <span>Will appear live on the big stage</span>
              <span className="font-bold">{textAnswer.length}/40</span>
            </div>
          </div>
        )}

        {/* TYPE 4: RATING SCALE */}
        {question.type === 'rating' && (() => {
          const style = question.ratingStyle || 'numeric';
          const maxVal = question.ratingMax || 5;
          const minVal = question.ratingMin || 1;
          const range = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
          const emojis = ['😡', '🙁', '😐', '😊', '🤩'];
          const likertDefaults = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];

          return (
            <div className="neo-card p-4 sm:p-5 space-y-4">
              
              {/* Header Labels */}
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider font-mono px-1">
                <span>{question.ratingMinLabel || `${minVal} (Rendah)`}</span>
                <span className="text-[#4F46E5]">{question.ratingMaxLabel || `${maxVal} (Tinggi)`}</span>
              </div>

              {/* Stars */}
              {style === 'stars' && (
                <div className="flex items-center justify-center space-x-2 py-2">
                  {range.map((num) => {
                    const isSelected = (ratingValue || 0) >= num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setRatingValue(num)}
                        className={`p-1.5 rounded-lg border-2 border-[#1E1E1E] transition-transform cursor-pointer ${
                          isSelected ? 'bg-[#FACC15] scale-110' : 'bg-white hover:scale-105'
                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                        style={{ boxShadow: isSelected ? 'none' : '2px 2px 0px #1E1E1E' }}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 ${
                            isSelected
                              ? 'fill-[#1E1E1E] text-[#1E1E1E]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Emoji Mood */}
              {style === 'emoji' && (
                <div className="grid grid-cols-5 gap-2">
                  {range.map((num, i) => {
                    const isSelected = ratingValue === num;
                    const emoji = emojis[i] || '🙂';
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setRatingValue(num)}
                        className={`py-3 sm:py-4 rounded-lg border-2 border-[#1E1E1E] text-2xl sm:text-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#4F46E5]/10 shadow-none translate-x-[1px] translate-y-[1px] scale-105'
                            : 'bg-white'
                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                        style={{ boxShadow: isSelected ? 'none' : '2px 2px 0px #1E1E1E' }}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-black text-gray-500 mt-1 font-mono">{num}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Likert */}
              {style === 'likert' && (
                <div className="space-y-2">
                  {range.map((num, i) => {
                    const isSelected = ratingValue === num;
                    const labelText = question.ratingLabels?.[i] || likertDefaults[i] || `Tingkat ${num}`;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setRatingValue(num)}
                        className={`w-full p-3 sm:p-3.5 rounded-lg border-2 border-[#1E1E1E] text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#4F46E5]/10 shadow-none translate-x-[2px] translate-y-[2px]'
                            : 'bg-white'
                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}
                        style={{ boxShadow: isSelected ? 'none' : '2px 2px 0px #1E1E1E' }}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-md border-2 border-[#1E1E1E] flex items-center justify-center text-xs font-black font-mono ${
                            isSelected ? 'bg-[#4F46E5] text-white' : 'bg-white text-[#1E1E1E]'
                          }`}>
                            {num}
                          </span>
                          <span className={`text-sm font-bold ${isSelected ? 'text-[#4F46E5] font-black' : 'text-[#1E1E1E]'}`}>
                            {labelText}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#4F46E5] bg-[#4F46E5] text-white' : 'border-[#1E1E1E]'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Numeric Scale */}
              {style === 'numeric' && (
                <div className="space-y-2">
                  <div className={`grid gap-2 ${range.length > 5 ? 'grid-cols-5 sm:grid-cols-10' : 'grid-cols-5'}`}>
                    {range.map((num) => {
                      const isSelected = ratingValue === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isLocked}
                          onClick={() => setRatingValue(num)}
                          className={`py-3.5 sm:py-4 rounded-lg border-2 border-[#1E1E1E] font-black text-lg sm:text-xl flex items-center justify-center transition-all cursor-pointer font-mono ${
                            isSelected
                              ? 'bg-[#4F46E5] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                              : 'bg-white text-[#1E1E1E]'
                          } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                          style={{ boxShadow: isSelected ? 'none' : '3px 3px 0px #1E1E1E' }}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Value Badge */}
              {ratingValue !== undefined && ratingValue !== null && (
                <div className="text-center pt-2 text-xs font-bold text-[#4F46E5] neo-badge bg-[#4F46E5]/10 py-2 px-4 inline-flex mx-auto w-full justify-center">
                  Pilihan kamu: <span className="font-black text-sm ml-1">{ratingValue}</span> / {maxVal}
                  {question.ratingLabels?.[(ratingValue || minVal) - minVal] && (
                    <span className="ml-1 text-gray-500 font-normal">({question.ratingLabels[(ratingValue || minVal) - minVal]})</span>
                  )}
                </div>
              )}

            </div>
          );
        })()}

        {/* TYPE 5: OPEN TEXT */}
        {question.type === 'open_text' && (
          <div className="neo-card p-4">
            <textarea
              id="open-text-input"
              rows={3}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your response here..."
              maxLength={280}
              disabled={isLocked}
              autoFocus
              className="neo-input w-full text-sm resize-none"
            />
            <div className="flex justify-between items-center mt-1.5 text-[11px] text-gray-400 font-mono">
              <span>Submitted live to moderator</span>
              <span className="font-bold">{textAnswer.length}/280</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Submit Action */}
      <div className="pt-3">
        {isLocked ? (
          <div className="w-full py-3.5 px-4 bg-gray-100 border-2 border-[#1E1E1E] rounded-lg text-gray-500 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Voting is closed for this question</span>
          </div>
        ) : (
          <button
            id="participant-submit-answer-btn"
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !isFormValid()}
            className="neo-btn w-full py-3.5 sm:py-4 px-5 bg-[#FACC15] text-[#1E1E1E] font-black text-sm sm:text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-[#1E1E1E]" />
                <span className="tracking-wide font-mono">Submitting Vote...</span>
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
