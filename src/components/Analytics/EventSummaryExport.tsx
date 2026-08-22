import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Participant, Question } from '../../types';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Trophy, 
  FileSpreadsheet, 
  Layers, 
  AlertTriangle,
  Sliders,
  BarChart3,
  Trash2
} from 'lucide-react';

export const EventSummaryExport: React.FC = () => {
  const { currentEvent, sendModeratorAction, setActiveView, clearAllParticipants } = useEvent();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  if (!currentEvent) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">No Event Selected</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Create or select an event in Admin Studio to view its analytics report.
        </p>
        <button
          onClick={() => setActiveView('admin')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
        >
          <span>Go to Admin Studio</span>
        </button>
      </div>
    );
  }

  const totalParticipants = currentEvent.participants.length;
  const totalResponses = currentEvent.responses.length;
  const totalQuestions = currentEvent.questions.length;
  const avgResponsesPerQ = totalQuestions > 0 ? (totalResponses / totalQuestions).toFixed(1) : '0';

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
    link.setAttribute('download', `PulseLive-${currentEvent.roomCode}-Analytics-Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleResetData = async () => {
    await clearAllParticipants();
    await sendModeratorAction('reset_session');
    setShowCleanupModal(false);
  };

  const getParticipantAnswerForQuestion = (pId: string, q: Question) => {
    const resp = currentEvent.responses.find(r => r.participantId === pId && r.questionId === q.id);
    if (!resp) return { answered: false, text: 'Tidak menjawab' };

    let text = resp.textResponse || '';
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const selectedOpts = (resp.selectedOptionIds || []).map(id => {
        const opt = q.options?.find(o => o.id === id);
        return opt ? opt.text : id;
      });
      text = selectedOpts.join(', ');
    } else if (q.type === 'rating') {
      text = `Skor ${resp.ratingValue} / ${q.ratingMax || 5}.0`;
    }

    const isCorrect = q.options?.some(o => o.isCorrect && resp.selectedOptionIds?.includes(o.id));

    return {
      answered: true,
      text: text || 'Jawaban kosong',
      timeTaken: resp.timeTakenSeconds,
      submittedAt: resp.submittedAt,
      isCorrect,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6 animate-in fade-in">
      
      {/* Top Header & Export Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-bold font-mono-numbers bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              PIN: {currentEvent.roomCode}
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {currentEvent.category}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            {currentEvent.title} | Analytics & Export
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organized by <strong>{currentEvent.organizerName}</strong> • {new Date(currentEvent.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="download-csv-report-btn"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadSuccess ? 'Downloaded!' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => setActiveView('presenter')}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Presenter</span>
          </button>

          <button
            onClick={() => setShowCleanupModal(true)}
            className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
            title="Clean up responses"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Participants</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {totalParticipants}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Unique attendees joined</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Votes</span>
            <MessageSquare className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {totalResponses}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">~{avgResponsesPerQ} per question</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Questions</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {totalQuestions}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Polls & quizzes</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Speed</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            6.8s
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Average response time</p>
        </div>
      </div>

      {/* Main Breakdown: Question-by-Question Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Question Performance Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">Question Performance Breakdown</h2>
            <span className="text-xs text-slate-400 font-semibold">{currentEvent.questions.length} questions</span>
          </div>

          <div className="space-y-4">
            {currentEvent.questions.map((q, idx) => {
              const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
              const qTotal = qResponses.length;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Q{idx + 1} • {q.type.replace('_', ' ').toUpperCase()}
                      </span>
                      {q.points ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          +{q.points} pts
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-bold font-mono-numbers text-slate-600">
                      {qTotal} responses
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                    {q.title}
                  </h3>

                  {/* Multiple Choice Stats */}
                  {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt, optIdx) => {
                        const count = qResponses.filter(r => r.selectedOptionIds?.includes(opt.id)).length;
                        const pct = qTotal > 0 ? Math.round((count / qTotal) * 100) : 0;

                        return (
                          <div key={opt.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                              <span className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                  {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                                </span>
                                <span>{opt.text}</span>
                                {opt.isCorrect && (
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Correct
                                  </span>
                                )}
                              </span>
                              <span className="font-mono-numbers">{pct}% ({count})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${opt.isCorrect ? 'bg-emerald-500' : 'bg-indigo-600'}`}
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
                    <div className="pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {qResponses.length === 0 ? (
                          <span className="text-xs text-slate-400">No submissions yet</span>
                        ) : (
                          qResponses.map((r, i) => (
                            <span
                              key={r.id || i}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-semibold"
                            >
                              {r.textResponse}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating Score Summary */}
                  {q.type === 'rating' && (
                    <div className="pt-1 flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500">Average Rating</div>
                        <div className="text-xl font-bold text-amber-500 font-mono-numbers">
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
                    <div className="pt-1 space-y-1.5 max-h-36 overflow-y-auto">
                      {qResponses.map(r => (
                        <div key={r.id} className="p-2 bg-slate-50 rounded-xl text-xs border border-slate-200">
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

        {/* Right 1 Col: Leaderboard / Individual Participant Inspector */}
        <div className="space-y-5">
          
          {/* Top Leaderboard or Active Attendees */}
          {(() => {
            const hasQuizScoring = currentEvent.isQuizMode || currentEvent.questions.some(q => (q.points || 0) > 0 || (q.options || []).some(o => o.isCorrect));

            return (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs sm:text-sm font-display">
                    {hasQuizScoring ? (
                      <>
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Leaderboard Standings</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Partisipasi Audiens</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{hasQuizScoring ? 'Top Ranking' : `${currentEvent.participants.length} Peserta`}</span>
                </div>

                <p className="text-[11px] text-slate-500 mb-2.5">
                  Klik nama peserta di bawah untuk melihat rincian jawaban per soal:
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {currentEvent.participants.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Belum ada data peserta yang terhubung.</p>
                  ) : (
                    [...currentEvent.participants].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, idx) => {
                      const pResponses = currentEvent.responses.filter(r => r.participantId === p.id).length;
                      const responseRate = currentEvent.questions.length > 0 ? Math.round((pResponses / currentEvent.questions.length) * 100) : 0;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedParticipant(p)}
                          className="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-100 hover:border-indigo-200 text-xs transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <span 
                              className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: p.avatarBg || '#4F46E5' }}
                            >
                              {p.avatarEmoji || '👋'}
                            </span>
                            <span className="font-bold text-slate-800 group-hover:text-indigo-900 truncate">{p.name}</span>
                          </div>

                          {hasQuizScoring && p.score !== undefined && p.score > 0 ? (
                            <span className="font-mono-numbers font-bold text-indigo-700 shrink-0">{p.score} pts</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md font-mono text-[10px] font-bold shrink-0">
                              {pResponses}/{currentEvent.questions.length} ({responseRate}%) ➔
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* Quick Session Health Check */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-xs space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 font-display">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Raw Data Export</span>
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Export all audience vote choices, text submissions, and response durations for analysis in Microsoft Excel or Google Sheets.
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Download CSV Report
            </button>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PARTICIPANT ANSWER INSPECTOR MODAL */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs"
                  style={{ backgroundColor: selectedParticipant.avatarBg || '#4F46E5' }}
                >
                  {selectedParticipant.avatarEmoji || '👋'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Rincian Jawaban: {selectedParticipant.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bergabung {new Date(selectedParticipant.joinedAt).toLocaleTimeString()} • {selectedParticipant.score || 0} pts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List of Questions and Specific Participant Answer */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {currentEvent.questions.map((q, idx) => {
                const ans = getParticipantAnswerForQuestion(selectedParticipant.id, q);

                return (
                  <div key={q.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700 font-mono">
                        Soal {idx + 1} ({q.type.replace('_', ' ')})
                      </span>
                      {ans.answered ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                          Dijawab ({ans.timeTaken || 0}s)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-full font-semibold">
                          Lewat
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-900">
                      {q.title}
                    </p>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Jawaban {selectedParticipant.name}:</span>
                      <span className="font-semibold text-indigo-950">"{ans.text}"</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA RESET MODAL */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-3.5 animate-in fade-in">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Session Responses?</h3>
                <p className="text-[11px] text-slate-500">This will clear all participant votes for this event.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to reset <strong className="text-slate-800">{currentEvent.title}</strong>? All {totalResponses} responses will be cleared for a new session.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCleanupModal(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

