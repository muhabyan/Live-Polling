import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { AiGeneratingSpinner } from '../Shared/Loaders';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  CheckCircle, 
  Sparkles, 
  Users, 
  Clock, 
  Plus, 
  Radio, 
  Zap,
  StopCircle,
  Tv,
  ListOrdered,
  BrainCircuit,
  Trash2
} from 'lucide-react';
import * as api from '../../utils/api';

export const PresenterControl: React.FC = () => {
  const { 
    currentEvent, 
    sendModeratorAction, 
    simulateAudienceVotes, 
    isSimulatingCrowd,
    setActiveView,
    refreshEvent,
    deleteParticipant,
    clearAllParticipants,
    autoAdvance,
    setAutoAdvance,
    autoAdvanceDelay,
    setAutoAdvanceDelay,
    autoAdvanceCountdown
  } = useEvent();

  const [isSummarizingAI, setIsSummarizingAI] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<{
    summary: string;
    keyThemes: string[];
    sentiment: string;
    moderatorTip: string;
  } | null>(null);

  const currentQIndex = currentEvent?.currentQuestionIndex ?? 0;
  const currentQ = currentEvent?.questions?.[currentQIndex];

  if (!currentEvent || !currentEvent.questions || currentEvent.questions.length === 0 || !currentQ) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 neo-card text-center space-y-4">
        <div className="w-14 h-14 bg-[#4F46E5]/10 text-[#4F46E5] border-2 border-[#1E1E1E] rounded-xl flex items-center justify-center mx-auto" style={{ boxShadow: '3px 3px 0px #1E1E1E' }}>
          <Radio className="w-7 h-7 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-[#1E1E1E] font-display uppercase">
          {!currentEvent ? 'No Active Event Selected' : 'No Questions in this Event'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 font-mono">
          {!currentEvent
            ? "Create your live polling session in Admin Studio to start presenting."
            : "Add interactive questions in Admin Studio to start polling."}
        </p>
        <button
          onClick={() => setActiveView('admin')}
          className="neo-btn px-5 py-2.5 bg-[#FACC15] text-[#1E1E1E] font-black text-xs sm:text-sm mx-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open Admin Studio</span>
        </button>
      </div>
    );
  }

  const responses = (currentEvent.responses || []).filter(r => r.questionId === currentQ?.id);
  const totalResponses = responses.length;
  const totalParticipants = Math.max(currentEvent.participants.length, totalResponses);
  const responsePct = totalParticipants > 0 ? Math.round((totalResponses / totalParticipants) * 100) : 0;

  const handleGenerateAISummary = async () => {
    if (!currentQ) return;
    setIsSummarizingAI(true);
    try {
      const summary = await api.summarizeAudienceResponses(currentQ.title, responses);
      setAiSummaryResult(summary);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSummarizingAI(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      
      {/* Top Banner / Master Session Status */}
      <div className="neo-card p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#4F46E5] border-2 border-[#1E1E1E] flex items-center justify-center text-white font-black text-lg shrink-0" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#1E1E1E] truncate font-display">
                {currentEvent.title}
              </h1>
              <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] shrink-0 font-mono">
                PIN: {currentEvent.roomCode}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-bold mt-0.5 font-mono">
              Presenter Cockpit • {currentEvent.organizerName} • {currentEvent.category}
            </p>
          </div>
        </div>

        {/* Quick Launch & Status Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('projector')}
            className="neo-btn bg-[#1E1E1E] text-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs"
          >
            <Tv className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Open Stage View</span>
          </button>

          {currentEvent.status === 'waiting' && (
            <button
              id="presenter-start-session-btn"
              onClick={() => sendModeratorAction('start_session')}
              className="neo-btn bg-[#34D399] text-[#1E1E1E] px-3.5 py-1.5 sm:py-2 text-xs font-black"
            >
              <Play className="w-3.5 h-3.5 fill-[#1E1E1E]" />
              <span>Start Session</span>
            </button>
          )}

          {currentEvent.status === 'live' && (
            <button
              id="presenter-end-session-btn"
              onClick={() => sendModeratorAction('end_session')}
              className="neo-btn bg-white text-[#1E1E1E] px-3.5 py-1.5 sm:py-2 text-xs font-bold hover:bg-[#FB7185]/20"
            >
              <StopCircle className="w-3.5 h-3.5 text-gray-600" />
              <span>End Session</span>
            </button>
          )}

          <button
            onClick={async () => {
              if (window.confirm('Reset all participants and vote responses for this session?')) {
                await sendModeratorAction('reset_session');
                await clearAllParticipants();
                await refreshEvent();
              }
            }}
            className="neo-btn bg-white text-gray-600 hover:text-[#FB7185] hover:bg-[#FB7185]/10 px-2.5 py-1.5 sm:py-2 text-xs font-bold"
            title="Clear all responses and participants"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Control Deck Left, Slide List & Live Insights Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT COLUMN: ACTIVE SLIDE COCKPIT */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Active Question Preview Card */}
          <div className="neo-card p-5 sm:p-7 relative overflow-hidden">
            
            {/* Top Question Tag & Navigation Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] font-mono">
                  Question {currentQIndex + 1} / {currentEvent.questions.length}
                </span>
                <span className="neo-badge bg-gray-100 text-gray-700 font-mono">
                  {currentQ?.type.replace('_', ' ')}
                </span>
              </div>

              {/* Live Timer Counter */}
              <div className="neo-badge bg-[#1E1E1E] text-white px-3 py-1 text-sm font-mono">
                <Clock className={`w-3.5 h-3.5 ${currentEvent.isTimerRunning ? 'text-[#34D399] animate-spin' : 'text-gray-400'}`} />
                <span>
                  {(() => {
                    const remaining = currentEvent.timerRemainingSeconds ?? (currentQ?.timerSeconds || 45);
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-black text-[#1E1E1E] leading-snug mb-1 font-display">
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mb-4 font-mono">
                {currentQ.subtitle}
              </p>
            )}

            {/* Question Options or Submissions Summary */}
            <div className="bg-[#FFF8F0] border-2 border-[#1E1E1E] rounded-xl p-3.5 sm:p-4 mb-5">
              <div className="text-[11px] font-black uppercase tracking-wider text-gray-600 mb-2.5 flex items-center justify-between font-mono">
                <span>Live Breakdown</span>
                <span className="neo-badge bg-white text-[#1E1E1E]">{responses.length} votes</span>
              </div>

              {currentQ?.type === 'multiple_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(currentQ.options || []).map((opt, i) => {
                    const count = responses.filter(r => r.selectedOptionIds?.includes(opt.id)).length;
                    const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border-2 border-[#1E1E1E] text-xs flex items-center justify-between ${
                          opt.isCorrect && currentEvent.revealAnswer
                            ? 'bg-[#34D399]/30 font-black'
                            : 'bg-white text-[#1E1E1E]'
                        }`}
                        style={{ boxShadow: '2px 2px 0px #1E1E1E' }}
                      >
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <span className="w-5 h-5 rounded-md bg-[#1E1E1E] text-white flex items-center justify-center font-black text-[10px] shrink-0 font-mono">
                            {['A', 'B', 'C', 'D', 'E'][i]}
                          </span>
                          <span className="truncate font-bold">{opt.text}</span>
                        </div>
                        <span className="font-mono font-black text-[#1E1E1E] shrink-0">{pct}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQ?.type === 'word_cloud' && (
                <p className="text-xs text-gray-600 font-mono">
                  Word cloud active. Words submitted by audience are dynamically weighted on the projector stage.
                </p>
              )}

              {currentQ?.type === 'rating' && (
                <div className="flex items-center justify-between text-xs text-[#1E1E1E] font-bold">
                  <span>
                    Skala: {currentQ.ratingMinLabel || '1 (Rendah)'} ➔ {currentQ.ratingMaxLabel || '5 (Tinggi)'}
                  </span>
                  <span className="neo-badge bg-[#4F46E5] text-white font-mono">
                    Avg: {totalResponses > 0 ? (responses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalResponses).toFixed(1) : '0.0'} / {currentQ.ratingMax || 5}.0
                  </span>
                </div>
              )}

              {currentQ?.type === 'open_text' && (
                <div className="text-xs text-gray-600">
                  {responses.length > 0 ? (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {responses.slice(-3).map(r => (
                        <div key={r.id} className="p-2 bg-white rounded-lg border-2 border-[#1E1E1E]" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                          <span className="font-black text-[#1E1E1E]">{r.participantName}:</span> {r.textResponse}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="font-mono text-gray-400">No audience open text submissions yet.</span>
                  )}
                </div>
              )}
            </div>

            {/* Participation Progress Bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-bold text-[#1E1E1E] font-mono">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Room Participation</span>
                </span>
                <span>{totalResponses} / {totalParticipants} ({responsePct}%)</span>
              </div>
              <div className="w-full bg-white border-2 border-[#1E1E1E] h-3 rounded-md overflow-hidden">
                <div
                  className="bg-[#34D399] h-full transition-all duration-500"
                  style={{ width: `${responsePct}%` }}
                />
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              
              {/* Previous Question */}
              <button
                id="presenter-prev-q-btn"
                onClick={() => sendModeratorAction('prev_question')}
                disabled={currentQIndex === 0}
                className="neo-btn bg-white text-[#1E1E1E] px-3 py-2.5 text-xs font-bold"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Prev Question</span>
              </button>

              {/* Toggle Timer */}
              <button
                id="presenter-toggle-timer-btn"
                onClick={() => sendModeratorAction('toggle_timer')}
                className="neo-btn bg-white text-[#1E1E1E] px-3 py-2.5 text-xs font-bold"
              >
                {currentEvent.isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>Start Timer</span>
                  </>
                )}
              </button>

              {/* Add +15 Seconds */}
              <button
                id="presenter-add-time-btn"
                onClick={() => sendModeratorAction('add_time', { seconds: 15 })}
                className="neo-btn bg-white text-[#1E1E1E] px-3 py-2.5 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>+15 Sec</span>
              </button>

              {/* Next Question or Finish Session on Last Question */}
              {currentQIndex >= currentEvent.questions.length - 1 ? (
                <button
                  id="presenter-finish-session-btn"
                  onClick={() => sendModeratorAction('end_session')}
                  className="neo-btn bg-[#34D399] text-[#1E1E1E] px-3 py-2.5 text-xs font-black animate-pulse"
                >
                  <span>Finish & Finale 🏁</span>
                </button>
              ) : (
                <button
                  id="presenter-next-q-btn"
                  onClick={() => sendModeratorAction('next_question')}
                  className="neo-btn bg-[#FACC15] text-[#1E1E1E] px-3 py-2.5 text-xs font-black"
                >
                  <span>Next</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* ⚡ Auto-Pilot Control Strip */}
            <div className={`mt-4 p-3 sm:p-3.5 rounded-xl border-2 border-[#1E1E1E] transition-all ${
              autoAdvance
                ? 'bg-[#FACC15]/20 shadow-[3px_3px_0px_#1E1E1E]'
                : 'bg-[#FFF8F0]'
            }`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Toggle Switch */}
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => setAutoAdvance(!autoAdvance)}
                    className={`relative w-11 h-6 rounded-full border-2 border-[#1E1E1E] transition-all duration-200 cursor-pointer ${
                      autoAdvance ? 'bg-[#34D399]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-[1px] w-4 h-4 rounded-full bg-[#1E1E1E] transition-all duration-200 ${
                      autoAdvance ? 'left-[22px]' : 'left-[2px]'
                    }`} />
                  </button>
                  <div className="flex items-center space-x-1.5">
                    <Zap className={`w-3.5 h-3.5 ${
                      autoAdvance ? 'text-[#1E1E1E]' : 'text-gray-400'
                    }`} />
                    <span className="text-xs font-black text-[#1E1E1E] uppercase font-mono">
                      Auto-Pilot
                    </span>
                  </div>
                </div>

                {/* Delay Selector */}
                {autoAdvance && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold text-[#1E1E1E] uppercase font-mono">Jeda:</span>
                    {[3, 5, 8, 10].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setAutoAdvanceDelay(sec)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-black border-2 border-[#1E1E1E] cursor-pointer font-mono ${
                          autoAdvanceDelay === sec
                            ? 'bg-[#1E1E1E] text-white'
                            : 'bg-white text-[#1E1E1E] hover:bg-gray-100'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Countdown Indicator */}
                {autoAdvanceCountdown !== null && (
                  <div className="neo-badge bg-[#FB7185] text-[#1E1E1E] text-xs font-mono animate-pulse">
                    <SkipForward className="w-3 h-3" />
                    <span>
                      {currentQIndex >= currentEvent.questions.length - 1
                        ? `Finishing in ${autoAdvanceCountdown}s...`
                        : `Next in ${autoAdvanceCountdown}s...`}
                    </span>
                  </div>
                )}
              </div>

              {autoAdvance && autoAdvanceCountdown === null && (
                <p className="text-[10px] text-gray-600 mt-1.5 font-bold font-mono">
                  Timer habis ➔ jeda {autoAdvanceDelay}s ➔ otomatis lanjut ke soal berikutnya.
                </p>
              )}
            </div>

            {/* Quick Action Toggles */}
            <div className="mt-4 pt-3.5 border-t-2 border-[#1E1E1E]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Lock Voting Toggle */}
                <button
                  id="presenter-lock-voting-btn"
                  onClick={() => sendModeratorAction('toggle_lock_voting')}
                  className={`neo-btn px-3 py-1.5 text-xs font-bold ${
                    currentEvent.isVotingLocked
                      ? 'bg-[#FB7185] text-[#1E1E1E]'
                      : 'bg-white text-[#1E1E1E]'
                  }`}
                >
                  {currentEvent.isVotingLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{currentEvent.isVotingLocked ? 'Voting Locked' : 'Lock Voting'}</span>
                </button>

                {/* Show/Hide Results Toggle */}
                <button
                  onClick={() => sendModeratorAction('toggle_results')}
                  className={`neo-btn px-3 py-1.5 text-xs font-bold ${
                    currentEvent.showResultsOnProjector
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white text-[#1E1E1E]'
                  }`}
                >
                  {currentEvent.showResultsOnProjector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentEvent.showResultsOnProjector ? 'Results Visible' : 'Results Hidden'}</span>
                </button>

                {/* Reveal Answer Toggle */}
                {(currentQ?.type === 'multiple_choice' || currentQ?.type === 'true_false') && (
                  <button
                    onClick={() => sendModeratorAction('toggle_reveal_answer')}
                    className={`neo-btn px-3 py-1.5 text-xs font-bold ${
                      currentEvent.revealAnswer
                        ? 'bg-[#34D399] text-[#1E1E1E]'
                        : 'bg-white text-[#1E1E1E]'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{currentEvent.revealAnswer ? 'Answer Revealed' : 'Reveal Answer'}</span>
                  </button>
                )}
              </div>

              {/* Reset Question Timer */}
              <button
                onClick={() => sendModeratorAction('reset_timer')}
                className="neo-btn bg-white text-gray-500 hover:text-[#1E1E1E] text-xs font-bold px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Timer</span>
              </button>
            </div>
          </div>

          {/* AI Live Audience Response Synthesizer */}
          <div className="neo-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#4F46E5] text-white border-2 border-[#1E1E1E] rounded-lg">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#1E1E1E] font-display uppercase">AI Audience Intelligence</h3>
                  <p className="text-[11px] text-gray-500 font-mono">Instant sentiment breakdown & moderator talking points</p>
                </div>
              </div>

              <button
                id="gemini-summarize-btn"
                onClick={handleGenerateAISummary}
                disabled={isSummarizingAI || responses.length === 0}
                className="neo-btn bg-[#FACC15] text-[#1E1E1E] px-3 py-1.5 text-xs font-black"
              >
                {isSummarizingAI ? (
                  <>
                    <AiGeneratingSpinner size="w-3.5 h-3.5" color="text-[#1E1E1E]" />
                    <span className="text-[10px] font-mono">ANALYZING</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Insights</span>
                  </>
                )}
              </button>
            </div>

            {aiSummaryResult ? (
              <div className="mt-3 p-3.5 bg-[#FFF8F0] rounded-xl border-2 border-[#1E1E1E] text-xs space-y-2.5" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                <div>
                  <span className="font-black text-[#1E1E1E] uppercase tracking-wider block text-[10px] mb-0.5 font-mono">Summary:</span>
                  <p className="text-[#1E1E1E] font-medium leading-relaxed">
                    {aiSummaryResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t-2 border-[#1E1E1E]/10">
                  <div>
                    <span className="font-black text-[#1E1E1E] uppercase tracking-wider block text-[10px] mb-0.5 font-mono">Key Themes:</span>
                    <ul className="list-disc list-inside text-[#1E1E1E] font-medium space-y-0.5">
                      {aiSummaryResult.keyThemes.map((theme, i) => (
                        <li key={i}>{theme}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-black text-[#1E1E1E] uppercase tracking-wider block text-[10px] mb-0.5 font-mono">Sentiment:</span>
                    <span className="neo-badge bg-white text-[#1E1E1E]">
                      {aiSummaryResult.sentiment}
                    </span>
                    <div className="mt-1.5 text-[#1E1E1E]">
                      <strong className="font-black">Speaker Tip:</strong> {aiSummaryResult.moderatorTip}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1 font-mono">
                Click above to generate real-time AI key themes from the <strong className="text-[#1E1E1E]">{responses.length} responses</strong>.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION TIMELINE & CONNECTED AUDIENCE */}
        <div className="space-y-5">
          
          {/* Question Sequence List */}
          <div className="neo-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5 text-[#1E1E1E] font-black text-xs sm:text-sm font-display uppercase">
                <ListOrdered className="w-4 h-4 text-[#4F46E5]" />
                <span>Session Timeline</span>
              </div>
              <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] font-mono">
                {currentEvent.questions.length} questions
              </span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
              {currentEvent.questions.map((q, idx) => {
                const isActive = currentQIndex === idx;
                const qResponses = currentEvent.responses.filter(r => r.questionId === q.id).length;

                return (
                  <button
                    key={q.id}
                    onClick={() => sendModeratorAction('jump_to_question', { index: idx })}
                    className={`w-full text-left p-2.5 rounded-lg border-2 border-[#1E1E1E] transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#4F46E5] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                        : 'bg-white text-[#1E1E1E] hover:bg-[#FACC15]/20'
                    }`}
                    style={{ boxShadow: isActive ? 'none' : '2px 2px 0px #1E1E1E' }}
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      <span className={`w-5 h-5 rounded-md border-2 border-[#1E1E1E] text-[11px] font-black flex items-center justify-center shrink-0 font-mono ${
                        isActive ? 'bg-white text-[#1E1E1E]' : 'bg-[#FFF8F0] text-[#1E1E1E]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{q.title}</div>
                        <div className={`text-[10px] uppercase font-mono ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{q.type.replace('_', ' ')} • {q.timerSeconds}s</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`neo-badge text-[10px] font-mono ${isActive ? 'bg-white text-[#1E1E1E]' : 'bg-[#FFF8F0] text-[#1E1E1E]'}`}>
                        {qResponses}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Participants Feed */}
          <div className="neo-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5 text-[#1E1E1E] font-black text-xs sm:text-sm font-display uppercase">
                <Users className="w-4 h-4 text-[#4F46E5]" />
                <span>Audience ({currentEvent.participants.length})</span>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap gap-y-1">
                <button
                  onClick={() => simulateAudienceVotes(10)}
                  disabled={isSimulatingCrowd}
                  className="neo-btn bg-[#FACC15] text-[#1E1E1E] px-2 py-0.5 text-[11px] font-black font-mono"
                  title="Simulate 10 participants answering"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>+10</span>
                </button>
                <button
                  onClick={() => simulateAudienceVotes(50)}
                  disabled={isSimulatingCrowd}
                  className="neo-btn bg-[#60A5FA] text-[#1E1E1E] px-2 py-0.5 text-[11px] font-black font-mono"
                  title="Simulate 50 participants answering"
                >
                  <span>+50</span>
                </button>
                <button
                  onClick={() => simulateAudienceVotes(100)}
                  disabled={isSimulatingCrowd}
                  className="neo-btn bg-[#34D399] text-[#1E1E1E] px-2 py-0.5 text-[11px] font-black font-mono"
                  title="Simulate 100 participants answering"
                >
                  <span>+100</span>
                </button>
                <button
                  onClick={() => simulateAudienceVotes(400)}
                  disabled={isSimulatingCrowd}
                  className="neo-btn bg-[#FB7185] text-[#1E1E1E] px-2 py-0.5 text-[11px] font-black font-mono"
                  title="Stress test with 400 participants answering concurrently"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>+400</span>
                </button>

                {currentEvent.participants.length > 0 && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Clear all ${currentEvent.participants.length} connected participants and reset votes?`)) {
                        await clearAllParticipants();
                        await sendModeratorAction('reset_session');
                      }
                    }}
                    className="neo-btn bg-white text-[#FB7185] hover:bg-[#FB7185]/20 px-2 py-0.5 text-[11px] font-black"
                    title="Clear all participants"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {currentEvent.participants.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center font-mono">No participants joined yet.</p>
              ) : (
                currentEvent.participants.slice(-8).reverse().map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border-2 border-[#1E1E1E] text-xs"
                    style={{ boxShadow: '2px 2px 0px #1E1E1E' }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-md border-2 border-[#1E1E1E] flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: p.avatarBg }}
                      >
                        {p.avatarEmoji || '👋'}
                      </div>
                      <span className="font-bold text-[#1E1E1E]">{p.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-gray-500 font-mono font-bold">
                        {p.score ? `${p.score} pts` : 'Active'}
                      </span>
                      <button
                        onClick={() => deleteParticipant(p.id)}
                        className="p-1 text-gray-400 hover:text-[#FB7185] transition-colors cursor-pointer"
                        title="Remove participant"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
