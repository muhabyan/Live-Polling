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
  Layers,
  ChevronRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import * as api from '../../utils/api';

export const PresenterControl: React.FC = () => {
  const { 
    currentEvent, 
    sendModeratorAction, 
    simulateAudienceVotes, 
    isSimulatingCrowd,
    setActiveView 
  } = useEvent();

  const [isSummarizingAI, setIsSummarizingAI] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<{
    summary: string;
    keyThemes: string[];
    sentiment: string;
    moderatorTip: string;
  } | null>(null);

  if (!currentEvent) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Event Selected</h2>
        <p className="text-sm text-slate-500">
          You haven't created any live polling sessions yet. Open Admin Studio to create your first event!
        </p>
        <button
          onClick={() => setActiveView('admin')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event in Admin Studio</span>
        </button>
      </div>
    );
  }

  const currentQIndex = currentEvent.currentQuestionIndex;
  const currentQ = currentEvent.questions[currentQIndex];
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Banner / Master Session Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {currentEvent.title}
              </h1>
              <span className="text-xs font-semibold font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                ROOM: {currentEvent.roomCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Presenter Cockpit • {currentEvent.organizerName} • {currentEvent.category}
            </p>
          </div>
        </div>

        {/* Quick Launch & Status Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <button
            onClick={() => setActiveView('projector')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <Tv className="w-4 h-4 text-slate-300" />
            <span>Open Projector View</span>
          </button>

          {currentEvent.status === 'waiting' && (
            <button
              id="presenter-start-session-btn"
              onClick={() => sendModeratorAction('start_session')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Live Session</span>
            </button>
          )}

          {currentEvent.status === 'live' && (
            <button
              id="presenter-end-session-btn"
              onClick={() => sendModeratorAction('end_session')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              <StopCircle className="w-4 h-4 text-slate-500" />
              <span>End Session</span>
            </button>
          )}

          {currentEvent.status === 'ended' && (
            <button
              onClick={() => sendModeratorAction('reset_session')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Restart Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Control Deck Left, Slide List & Live Insights Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE SLIDE COCKPIT (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Question Preview Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            
            {/* Top Question Tag & Navigation Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  Question {currentQIndex + 1} of {currentEvent.questions.length}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Type: {currentQ?.type.replace('_', ' ')}
                </span>
              </div>

              {/* Live Timer Counter */}
              <div className="flex items-center space-x-2 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <Clock className={`w-4 h-4 ${currentEvent.isTimerRunning ? 'text-slate-900 animate-spin' : 'text-slate-400'}`} />
                <span className="font-mono text-base font-semibold text-slate-900">
                  00:{currentEvent.timerRemainingSeconds! < 10 ? `0${currentEvent.timerRemainingSeconds}` : currentEvent.timerRemainingSeconds}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-2">
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className="text-sm text-slate-500 mb-6 font-medium">
                {currentQ.subtitle}
              </p>
            )}

            {/* Question Options or Submissions Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>Interactive Payload</span>
                <span>{responses.length} responses recorded</span>
              </div>

              {currentQ?.type === 'multiple_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(currentQ.options || []).map((opt, i) => {
                    const count = responses.filter(r => r.selectedOptionIds?.includes(opt.id)).length;
                    const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
                          opt.isCorrect && currentEvent.revealAnswer
                            ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {['A', 'B', 'C', 'D'][i]}
                          </span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700 shrink-0">{pct}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQ?.type === 'word_cloud' && (
                <p className="text-xs text-slate-600">
                  Word cloud active. Words submitted by audience will cluster dynamically on the projector screen.
                </p>
              )}

              {currentQ?.type === 'rating' && (
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>Scale: 1 to 5 Stars</span>
                  <span>Average rating: {totalResponses > 0 ? (responses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalResponses).toFixed(1) : '0.0'} / 5.0</span>
                </div>
              )}

              {currentQ?.type === 'open_text' && (
                <div className="text-xs text-slate-600">
                  {responses.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
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

            {/* Real-time Response Rate Bar */}
            <div className="space-y-1.5 mb-8">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audience Participation</span>
                </span>
                <span className="font-mono-numbers">{totalResponses} of {totalParticipants} voted ({responsePct}%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${responsePct}%` }}
                />
              </div>
            </div>

            {/* Primary Presenter Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* Previous Question */}
              <button
                id="presenter-prev-q-btn"
                onClick={() => sendModeratorAction('prev_question')}
                disabled={currentQIndex === 0}
                className="flex items-center justify-center space-x-1.5 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <SkipBack className="w-4 h-4" />
                <span>Prev Question</span>
              </button>

              {/* Toggle Timer */}
              <button
                id="presenter-toggle-timer-btn"
                onClick={() => sendModeratorAction('toggle_timer')}
                className="flex items-center justify-center space-x-1.5 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                {currentEvent.isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4 text-slate-600" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-slate-600" />
                    <span>Start Timer</span>
                  </>
                )}
              </button>

              {/* Add +15 Seconds */}
              <button
                id="presenter-add-time-btn"
                onClick={() => sendModeratorAction('add_time', { seconds: 15 })}
                className="flex items-center justify-center space-x-1.5 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>+15 Sec</span>
              </button>

              {/* Next Question */}
              <button
                id="presenter-next-q-btn"
                onClick={() => sendModeratorAction('next_question')}
                disabled={currentQIndex >= currentEvent.questions.length - 1}
                className="flex items-center justify-center space-x-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next Question</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Action Controls Toolbar */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Lock Voting Toggle */}
                <button
                  id="presenter-lock-voting-btn"
                  onClick={() => sendModeratorAction('toggle_lock_voting')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-colors ${
                    currentEvent.isVotingLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {currentEvent.isVotingLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{currentEvent.isVotingLocked ? 'Voting Locked' : 'Lock Voting'}</span>
                </button>

                {/* Show/Hide Results Toggle */}
                <button
                  onClick={() => sendModeratorAction('toggle_results')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-colors ${
                    currentEvent.showResultsOnProjector
                      ? 'bg-indigo-600 text-white border border-indigo-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {currentEvent.showResultsOnProjector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentEvent.showResultsOnProjector ? 'Results Visible' : 'Hide Results'}</span>
                </button>

                {/* Reveal Answer Toggle (for Multiple Choice / True False) */}
                {(currentQ?.type === 'multiple_choice' || currentQ?.type === 'true_false') && (
                  <button
                    onClick={() => sendModeratorAction('toggle_reveal_answer')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-colors ${
                      currentEvent.revealAnswer
                        ? 'bg-indigo-600 text-white border border-indigo-600'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{currentEvent.revealAnswer ? 'Answer Revealed' : 'Reveal Correct Answer'}</span>
                  </button>
                )}
              </div>

              {/* Reset Question Timer */}
              <button
                onClick={() => sendModeratorAction('reset_timer')}
                className="text-slate-400 hover:text-slate-700 font-semibold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Question Timer</span>
              </button>
            </div>
          </div>

          {/* Gemini AI Live Audience Response Synthesizer */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-violet-600 text-white rounded-lg shadow-sm">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Gemini Stage Intelligence</h3>
                  <p className="text-xs text-slate-500">Live audience sentiment & executive summary for presenter</p>
                </div>
              </div>

              <button
                id="gemini-summarize-btn"
                onClick={handleGenerateAISummary}
                disabled={isSummarizingAI || responses.length === 0}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-800 font-medium rounded-lg text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSummarizingAI ? (
                  <>
                    <AiGeneratingSpinner size="w-4 h-4" color="text-violet-600" />
                    <span className="animate-pulse tracking-wider text-violet-700 ml-1">ANALYZING SENTIMENT</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>Generate Audience Insight</span>
                  </>
                )}
              </button>
            </div>

            {aiSummaryResult ? (
              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 animate-fade-in text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">Executive Summary:</span>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {aiSummaryResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">Key Themes:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-medium">
                      {aiSummaryResult.keyThemes.map((theme, i) => (
                        <li key={i}>{theme}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">Audience Sentiment:</span>
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-semibold">
                      {aiSummaryResult.sentiment}
                    </span>
                    <div className="mt-2 text-slate-600">
                      <strong className="text-slate-800">Speaker Tip:</strong> {aiSummaryResult.moderatorTip}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                Click above to generate real-time AI takeaways from the <strong className="text-slate-700">{responses.length} responses</strong> submitted by the room.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION SEQUENCE JUMP DRAWER & AUDIENCE LIST */}
        <div className="space-y-6">
          
          {/* Question Sequence List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
                <ListOrdered className="w-4 h-4 text-slate-500" />
                <span>Session Timeline</span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {currentEvent.questions.length} questions
              </span>
            </div>

            <div className="space-y-2">
              {currentEvent.questions.map((q, idx) => {
                const isActive = currentQIndex === idx;
                const qResponses = currentEvent.responses.filter(r => r.questionId === q.id).length;

                return (
                  <button
                    key={q.id}
                    onClick={() => sendModeratorAction('jump_to_question', { index: idx })}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-slate-900 bg-slate-50 shadow-sm font-semibold text-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate mr-2">
                      <span className={`w-6 h-6 rounded-md text-xs font-semibold flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{q.title}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{q.type.replace('_', ' ')} • {q.timerSeconds}s</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {qResponses}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Participants Feed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Connected Room ({currentEvent.participants.length})</span>
              </div>

              <button
                onClick={() => simulateAudienceVotes(8)}
                disabled={isSimulatingCrowd}
                className="text-xs text-slate-600 font-medium hover:underline flex items-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                <span>+8 simulated</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {currentEvent.participants.slice(-8).reverse().map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: p.avatarBg }}
                    >
                      {p.avatarEmoji || '👋'}
                    </div>
                    <span className="font-bold text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.score ? `${p.score} pts` : 'Connected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
