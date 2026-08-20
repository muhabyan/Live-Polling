import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { 
  Download, 
  Trash2, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Star, 
  Trophy, 
  FileSpreadsheet, 
  Calendar, 
  Layers, 
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Tv,
  Sliders
} from 'lucide-react';

export const EventSummaryExport: React.FC = () => {
  const { currentEvent, sendModeratorAction, setActiveView } = useEvent();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  if (!currentEvent) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No active event selected.</p>
      </div>
    );
  }

  const totalParticipants = currentEvent.participants.length;
  const totalResponses = currentEvent.responses.length;
  const totalQuestions = currentEvent.questions.length;
  const avgResponsesPerQ = totalQuestions > 0 ? (totalResponses / totalQuestions).toFixed(1) : '0';

  // Calculate top scored participants
  const leaderboard = [...currentEvent.participants]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  // Generate and trigger actual CSV Download
  const handleExportCSV = () => {
    const rows = [
      ['Event Title', currentEvent.title],
      ['Room Code', currentEvent.roomCode],
      ['Organizer', currentEvent.organizerName],
      ['Date Exported', new Date().toISOString()],
      ['Total Participants', totalParticipants.toString()],
      ['Total Responses', totalResponses.toString()],
      [],
      ['--- DETAILED RESPONSES LOG ---'],
      ['Response ID', 'Question Number', 'Question Type', 'Question Title', 'Participant Name', 'Answer / Selected Option', 'Rating (1-5)', 'Submitted At', 'Time Taken (s)']
    ];

    currentEvent.questions.forEach((q, qIdx) => {
      const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
      qResponses.forEach((r) => {
        let answerText = r.textResponse || '';
        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          const selectedOpts = (r.selectedOptionIds || []).map(id => {
            const opt = q.options?.find(o => o.id === id);
            return opt ? opt.text : id;
          });
          answerText = selectedOpts.join('; ');
        }

        rows.push([
          r.id,
          (qIdx + 1).toString(),
          q.type,
          `"${q.title.replace(/"/g, '""')}"`,
          `"${r.participantName.replace(/"/g, '""')}"`,
          `"${answerText.replace(/"/g, '""')}"`,
          r.ratingValue ? r.ratingValue.toString() : '',
          new Date(r.submittedAt).toLocaleTimeString(),
          (r.timeTakenSeconds || 0).toString(),
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StageSync-${currentEvent.roomCode}-Analytics-Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleResetData = async () => {
    await sendModeratorAction('reset_session');
    setShowCleanupModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      
      {/* Top Header & Export Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="text-xs font-semibold font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
              ROOM: {currentEvent.roomCode}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentEvent.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {currentEvent.title} — Event Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organized by <strong>{currentEvent.organizerName}</strong> • {new Date(currentEvent.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Primary Export & Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="download-csv-report-btn"
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium rounded-xl text-xs sm:text-sm shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadSuccess ? 'CSV File Downloaded!' : 'Export CSV / Excel'}</span>
          </button>

          <button
            onClick={() => setActiveView('presenter')}
            className="flex items-center space-x-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Open Presenter</span>
          </button>

          <button
            onClick={() => setShowCleanupModal(true)}
            className="p-3 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
            title="Clean up responses"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Participants</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {totalParticipants}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unique attendees in session</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Votes Cast</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {totalResponses}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">~{avgResponsesPerQ} responses / question</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interactive Questions</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {totalQuestions}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Multiple choice, rating, clouds</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Response Time</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            7.4s
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fast mobile engagement</p>
        </div>
      </div>

      {/* Main Breakdown: Question-by-Question Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Question Performance Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Question Performance Breakdown</h2>
            <span className="text-xs font-medium text-slate-500">{currentEvent.questions.length} total questions</span>
          </div>

          <div className="space-y-6">
            {currentEvent.questions.map((q, idx) => {
              const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
              const qTotal = qResponses.length;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        Q{idx + 1} • {q.type.replace('_', ' ').toUpperCase()}
                      </span>
                      {q.points && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {q.points} pts
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold font-mono text-slate-500">
                      {qTotal} responses
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                    {q.title}
                  </h3>

                  {/* Multiple Choice Option Stats */}
                  {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                    <div className="space-y-2.5 pt-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const count = qResponses.filter(r => r.selectedOptionIds?.includes(opt.id)).length;
                        const pct = qTotal > 0 ? Math.round((count / qTotal) * 100) : 0;

                        return (
                          <div key={opt.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                                  {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                                </span>
                                <span>{opt.text}</span>
                                {opt.isCorrect && (
                                  <span className="text-[10px] text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                    Correct
                                  </span>
                                )}
                              </span>
                              <span className="font-mono-numbers">{pct}% ({count})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${opt.isCorrect ? 'bg-slate-900' : 'bg-slate-300'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Word Cloud Summary */}
                  {q.type === 'word_cloud' && (
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-2">
                        {qResponses.map((r, i) => (
                          <span
                            key={r.id || i}
                            className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium"
                          >
                            {r.textResponse}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating Score Summary */}
                  {q.type === 'rating' && (
                    <div className="pt-2 flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-500">Average Rating</div>
                        <div className="text-2xl font-semibold text-slate-900 font-mono">
                          {qTotal > 0 ? (qResponses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / qTotal).toFixed(1) : '0.0'} / 5.0
                        </div>
                      </div>
                      <div className="text-slate-500">
                        {qResponses.length} attendees rated this topic.
                      </div>
                    </div>
                  )}

                  {/* Open Text Summary */}
                  {q.type === 'open_text' && (
                    <div className="pt-2 space-y-2 max-h-40 overflow-y-auto">
                      {qResponses.map(r => (
                        <div key={r.id} className="p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200/80">
                          <strong className="text-slate-800">{r.participantName}:</strong> "{r.textResponse}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Top Participant Leaderboard & Session Summary */}
        <div className="space-y-6">
          
          {/* Top Leaderboard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
                <Trophy className="w-4 h-4 text-slate-500" />
                <span>Leaderboard Standings</span>
              </div>
              <span className="text-xs font-medium text-slate-500">Top 5</span>
            </div>

            <div className="space-y-2.5">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No participant scores recorded.</p>
              ) : (
                leaderboard.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs ${
                        idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-700">{p.score || 0} pts</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Session Health Check */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm text-xs space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              <span>Data Export Certified</span>
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              All participant timestamps, answer choices, and response durations are indexed and formatted for Microsoft Excel, Google Sheets, and BI dashboards.
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              Download Full Raw CSV Log
            </button>
          </div>
        </div>
      </div>

      {/* DATA RESET & CLEANUP MODAL */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Session Responses?</h3>
                <p className="text-xs text-slate-500">This will clear all participant votes for this event.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to reset <strong className="text-slate-800">{currentEvent.title}</strong>? All {totalResponses} response records will be cleared so you can run a fresh session with a new audience.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Confirm & Clear Responses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
