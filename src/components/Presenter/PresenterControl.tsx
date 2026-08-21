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
  Trash2,
  CheckCircle2
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
    clearAllParticipants
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
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <Radio className="w-7 h-7 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">
          {!currentEvent ? 'No Active Event Selected' : 'No Questions in this Event'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {!currentEvent
            ? "Create your live polling session in Admin Studio to start presenting."
            : "Add interactive questions in Admin Studio to start polling."}
        </p>
        <button
          onClick={() => setActiveView('admin')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-2xs">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate font-display">
                {currentEvent.title}
              </h1>
              <span className="text-[11px] font-mono-numbers font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                PIN: {currentEvent.roomCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Presenter Cockpit • {currentEvent.organizerName} • {currentEvent.category}
            </p>
          </div>
        </div>

        {/* Quick Launch & Status Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('projector')}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Stage View</span>
          </button>

          {currentEvent.status === 'waiting' && (
            <button
              id="presenter-start-session-btn"
              onClick={() => sendModeratorAction('start_session')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Session</span>
            </button>
          )}

          {currentEvent.status === 'live' && (
            <button
              id="presenter-end-session-btn"
              onClick={() => sendModeratorAction('end_session')}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>End Session</span>
            </button>
          )}

          <button
            onClick={async () => {
              if (window.confirm('Reset all participants and vote responses for this session?')) {
                await sendModeratorAction('reset_session');
                await refreshEvent();
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 sm:py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-2xs relative overflow-hidden">
            
            {/* Top Question Tag & Navigation Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Question {currentQIndex + 1} of {currentEvent.questions.length}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  {currentQ?.type.replace('_', ' ')}
                </span>
              </div>

              {/* Live Timer Counter */}
              <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                <Clock className={`w-3.5 h-3.5 ${currentEvent.isTimerRunning ? 'text-indigo-600 animate-spin' : 'text-slate-400'}`} />
                <span className="font-mono-numbers text-sm font-bold text-slate-900">
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-1 font-display">
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                {currentQ.subtitle}
              </p>
            )}

            {/* Question Options or Submissions Summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 mb-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
                <span>Live Breakdown</span>
                <span className="font-mono-numbers">{responses.length} votes recorded</span>
              </div>

              {currentQ?.type === 'multiple_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(currentQ.options || []).map((opt, i) => {
                    const count = responses.filter(r => r.selectedOptionIds?.includes(opt.id)).length;
                    const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          opt.isCorrect && currentEvent.revealAnswer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {['A', 'B', 'C', 'D', 'E'][i]}
                          </span>
                          <span className="truncate font-semibold">{opt.text}</span>
                        </div>
                        <span className="font-mono-numbers font-bold text-slate-700 shrink-0">{pct}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQ?.type === 'word_cloud' && (
                <p className="text-xs text-slate-600">
                  Word cloud active. Words submitted by audience are dynamically weighted on the projector stage.
                </p>
              )}

              {currentQ?.type === 'rating' && (
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>Scale: 1 to 5 Stars</span>
                  <span className="font-bold text-indigo-700">
                    Average: {totalResponses > 0 ? (responses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalResponses).toFixed(1) : '0.0'} / 5.0
                  </span>
                </div>
              )}

              {currentQ?.type === 'open_text' && (
                <div className="text-xs text-slate-600">
                  {responses.length > 0 ? (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {responses.slice(-3).map(r => (
                        <div key={r.id} className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800">{r.participantName}:</span> {r.textResponse}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>No audience open text submissions yet.</span>
                  )}
                </div>
              )}
            </div>

            {/* Participation Progress Bar */}
            <div className="space-y-1 mb-6">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Room Participation</span>
                </span>
                <span className="font-mono-numbers">{totalResponses} / {totalParticipants} answered ({responsePct}%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
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
                className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Prev Question</span>
              </button>

              {/* Toggle Timer */}
              <button
                id="presenter-toggle-timer-btn"
                onClick={() => sendModeratorAction('toggle_timer')}
                className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {currentEvent.isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Start Timer</span>
                  </>
                )}
              </button>

              {/* Add +15 Seconds */}
              <button
                id="presenter-add-time-btn"
                onClick={() => sendModeratorAction('add_time', { seconds: 15 })}
                className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>+15 Sec</span>
              </button>

              {/* Next Question */}
              <button
                id="presenter-next-q-btn"
                onClick={() => sendModeratorAction('next_question')}
                disabled={currentQIndex >= currentEvent.questions.length - 1}
                className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Secondary Action Controls Toolbar */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Lock Voting Toggle */}
                <button
                  id="presenter-lock-voting-btn"
                  onClick={() => sendModeratorAction('toggle_lock_voting')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentEvent.isVotingLocked
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {currentEvent.isVotingLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{currentEvent.isVotingLocked ? 'Voting Locked' : 'Lock Voting'}</span>
                </button>

                {/* Show/Hide Results Toggle */}
                <button
                  onClick={() => sendModeratorAction('toggle_results')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentEvent.showResultsOnProjector
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {currentEvent.showResultsOnProjector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentEvent.showResultsOnProjector ? 'Results Visible' : 'Results Hidden'}</span>
                </button>

                {/* Reveal Answer Toggle */}
                {(currentQ?.type === 'multiple_choice' || currentQ?.type === 'true_false') && (
                  <button
                    onClick={() => sendModeratorAction('toggle_reveal_answer')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentEvent.revealAnswer
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
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
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Timer</span>
              </button>
            </div>
          </div>

          {/* AI Live Audience Response Synthesizer */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-display">AI Live Audience Intelligence</h3>
                  <p className="text-[11px] text-slate-500">Instant sentiment breakdown & moderator talking points</p>
                </div>
              </div>

              <button
                id="gemini-summarize-btn"
                onClick={handleGenerateAISummary}
                disabled={isSummarizingAI || responses.length === 0}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSummarizingAI ? (
                  <>
                    <AiGeneratingSpinner size="w-3.5 h-3.5" color="text-indigo-600" />
                    <span className="text-[10px]">ANALYZING</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Analyze Insights</span>
                  </>
                )}
              </button>
            </div>

            {aiSummaryResult ? (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-0.5">Summary:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {aiSummaryResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-0.5">Key Themes:</span>
                    <ul className="list-disc list-inside text-slate-700 font-medium space-y-0.5">
                      {aiSummaryResult.keyThemes.map((theme, i) => (
                        <li key={i}>{theme}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-0.5">Sentiment:</span>
                    <span className="inline-block px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded font-semibold text-[11px]">
                      {aiSummaryResult.sentiment}
                    </span>
                    <div className="mt-1.5 text-slate-600">
                      <strong className="text-slate-800">Speaker Tip:</strong> {aiSummaryResult.moderatorTip}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Click above to generate real-time AI key themes from the <strong className="text-slate-700">{responses.length} responses</strong>.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION TIMELINE & CONNECTED AUDIENCE */}
        <div className="space-y-5">
          
          {/* Question Sequence List */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs sm:text-sm font-display">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                <span>Session Timeline</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
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
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs font-bold text-indigo-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      <span className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{q.title}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{q.type.replace('_', ' ')} • {q.timerSeconds}s</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono-numbers font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {qResponses}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Participants Feed */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs sm:text-sm font-display">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Connected Room ({currentEvent.participants.length})</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => simulateAudienceVotes(8)}
                  disabled={isSimulatingCrowd}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span>+8 mock</span>
                </button>

                {currentEvent.participants.length > 0 && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Clear all ${currentEvent.participants.length} connected participants and reset votes?`)) {
                        await clearAllParticipants();
                        await sendModeratorAction('reset_session');
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                    title="Clear all participants"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {currentEvent.participants.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No participants joined yet.</p>
              ) : (
                currentEvent.participants.slice(-8).reverse().map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-100 text-xs group"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: p.avatarBg }}
                      >
                        {p.avatarEmoji || '👋'}
                      </div>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        {p.score ? `${p.score} pts` : 'Active'}
                      </span>
                      <button
                        onClick={() => deleteParticipant(p.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
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
