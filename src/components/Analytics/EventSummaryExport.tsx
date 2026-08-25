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
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 neo-card text-center space-y-4">
        <div className="w-14 h-14 bg-[#4F46E5] text-white border-2 border-[#1E1E1E] rounded-xl flex items-center justify-center mx-auto" style={{ boxShadow: '3px 3px 0px #1E1E1E' }}>
          <BarChart3 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-[#1E1E1E] font-display uppercase">No Event Selected</h2>
        <p className="text-xs sm:text-sm text-gray-500 font-mono">
          Create or select an event in Admin Studio to view its analytics report.
        </p>
        <button
          onClick={() => setActiveView('admin')}
          className="neo-btn px-5 py-2.5 bg-[#FACC15] text-[#1E1E1E] font-black text-xs sm:text-sm mx-auto"
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
      <div className="neo-card p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] font-mono">
              PIN: {currentEvent.roomCode}
            </span>
            <span className="neo-badge bg-gray-100 text-gray-700 font-mono">
              {currentEvent.category}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1E1E1E] font-display uppercase">
            {currentEvent.title} | Analytics & Export
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Organized by <strong>{currentEvent.organizerName}</strong> • {new Date(currentEvent.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="download-csv-report-btn"
            onClick={handleExportCSV}
            className="neo-btn px-4 py-2 bg-[#34D399] text-[#1E1E1E] font-black text-xs sm:text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadSuccess ? 'Downloaded!' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => setActiveView('presenter')}
            className="neo-btn px-3 py-2 bg-white text-[#1E1E1E] text-xs font-bold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Presenter</span>
          </button>

          <button
            onClick={() => setShowCleanupModal(true)}
            className="neo-btn p-2 bg-white text-[#FB7185] hover:bg-[#FB7185]/20"
            title="Clean up responses"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Participants</span>
            <Users className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {totalParticipants}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Unique attendees joined</p>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Total Votes</span>
            <MessageSquare className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {totalResponses}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">~{avgResponsesPerQ} per question</p>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Questions</span>
            <Layers className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {totalQuestions}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Polls & quizzes</p>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Avg Speed</span>
            <Clock className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            6.8s
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Average response time</p>
        </div>
      </div>

      {/* Main Breakdown: Question-by-Question Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Question Performance Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#1E1E1E] font-display uppercase">Question Performance Breakdown</h2>
            <span className="neo-badge bg-white text-[#1E1E1E] font-mono">{currentEvent.questions.length} questions</span>
          </div>

          <div className="space-y-4">
            {currentEvent.questions.map((q, idx) => {
              const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
              const qTotal = qResponses.length;

              return (
                <div
                  key={q.id}
                  className="neo-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] text-[10px] font-mono">
                        Q{idx + 1} • {q.type.replace('_', ' ').toUpperCase()}
                      </span>
                      {q.points ? (
                        <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-[10px] font-mono">
                          +{q.points} pts
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-black font-mono text-gray-600">
                      {qTotal} responses
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-[#1E1E1E] font-display">
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
                            <div className="flex justify-between text-xs font-bold text-[#1E1E1E]">
                              <span className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-md border-2 border-[#1E1E1E] bg-[#FFF8F0] flex items-center justify-center text-[10px] font-black font-mono">
                                  {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                                </span>
                                <span>{opt.text}</span>
                                {opt.isCorrect && (
                                  <span className="neo-badge bg-[#34D399] text-[#1E1E1E] text-[9px]">
                                    Correct
                                  </span>
                                )}
                              </span>
                              <span className="font-mono font-black">{pct}% ({count})</span>
                            </div>
                            <div className="w-full bg-white border-2 border-[#1E1E1E] h-3 rounded-md overflow-hidden">
                              <div
                                className={`h-full ${opt.isCorrect ? 'bg-[#34D399]' : 'bg-[#4F46E5]'}`}
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
                          <span className="text-xs text-gray-400 font-mono">No submissions yet</span>
                        ) : (
                          qResponses.map((r, i) => (
                            <span
                              key={r.id || i}
                              className="neo-badge bg-[#60A5FA] text-[#1E1E1E] text-xs font-mono"
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
                    <div className="pt-1 flex items-center space-x-3 bg-[#FFF8F0] border-2 border-[#1E1E1E] p-3 rounded-lg text-xs" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                      <div>
                        <div className="text-[10px] font-black uppercase text-gray-500 font-mono">Average Rating</div>
                        <div className="text-xl font-black text-[#D97706] font-mono">
                          {qTotal > 0 ? (qResponses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / qTotal).toFixed(1) : '0.0'} / 5.0
                        </div>
                      </div>
                      <div className="text-gray-600 font-bold font-mono">
                        {qResponses.length} attendees rated this topic.
                      </div>
                    </div>
                  )}

                  {/* Open Text Summary */}
                  {q.type === 'open_text' && (
                    <div className="pt-1 space-y-1.5 max-h-36 overflow-y-auto">
                      {qResponses.map(r => (
                        <div key={r.id} className="p-2 bg-white rounded-lg text-xs border-2 border-[#1E1E1E]" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                          <strong className="text-[#1E1E1E]">{r.participantName}:</strong> "{r.textResponse}"
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
              <div className="neo-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-[#1E1E1E] font-black text-xs sm:text-sm font-display uppercase">
                    {hasQuizScoring ? (
                      <>
                        <Trophy className="w-4 h-4 text-[#FACC15]" />
                        <span>Leaderboard Standings</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-[#4F46E5]" />
                        <span>Audience Participation</span>
                      </>
                    )}
                  </div>
                  <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] font-mono text-[10px]">{hasQuizScoring ? 'Top Ranking' : `${currentEvent.participants.length} Peserta`}</span>
                </div>

                <p className="text-[11px] text-gray-500 mb-2.5 font-mono">
                  Klik nama peserta di bawah untuk melihat rincian jawaban per soal:
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {currentEvent.participants.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3 text-center font-mono">Belum ada data peserta yang terhubung.</p>
                  ) : (
                    [...currentEvent.participants].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => {
                      const pResponses = currentEvent.responses.filter(r => r.participantId === p.id).length;
                      const responseRate = currentEvent.questions.length > 0 ? Math.round((pResponses / currentEvent.questions.length) * 100) : 0;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedParticipant(p)}
                          className="w-full text-left flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-[#FACC15]/20 border-2 border-[#1E1E1E] text-xs transition-colors cursor-pointer"
                          style={{ boxShadow: '2px 2px 0px #1E1E1E' }}
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <span 
                              className="w-6 h-6 rounded-md border-2 border-[#1E1E1E] flex items-center justify-center font-bold text-[11px] text-white shrink-0"
                              style={{ backgroundColor: p.avatarBg || '#4F46E5' }}
                            >
                              {p.avatarEmoji || '👋'}
                            </span>
                            <span className="font-black text-[#1E1E1E] truncate">{p.name}</span>
                          </div>

                          {hasQuizScoring && p.score !== undefined && p.score > 0 ? (
                            <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-[10px] font-mono shrink-0">{p.score} pts</span>
                          ) : (
                            <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] font-mono text-[10px] shrink-0">
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

          {/* Raw Data Export Card */}
          <div className="neo-card p-5 text-xs space-y-2.5">
            <h4 className="font-black text-[#1E1E1E] flex items-center space-x-1.5 font-display uppercase">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>Full Raw Data Export</span>
            </h4>
            <p className="text-gray-600 leading-relaxed font-mono">
              Export all audience vote choices, text submissions, and response durations for analysis in Microsoft Excel or Google Sheets.
            </p>
            <button
              onClick={handleExportCSV}
              className="neo-btn w-full py-2 bg-[#34D399] text-[#1E1E1E] font-black"
            >
              Download CSV Report
            </button>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PARTICIPANT ANSWER INSPECTOR MODAL */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in">
          <div className="relative w-full max-w-lg neo-card p-6 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-[#1E1E1E] pb-3.5">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg border-2 border-[#1E1E1E] flex items-center justify-center text-xl"
                  style={{ backgroundColor: selectedParticipant.avatarBg || '#4F46E5', boxShadow: '2px 2px 0px #1E1E1E' }}
                >
                  {selectedParticipant.avatarEmoji || '👋'}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E1E1E] font-display uppercase">
                    Rincian: {selectedParticipant.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Bergabung {new Date(selectedParticipant.joinedAt).toLocaleTimeString()} • {selectedParticipant.score || 0} pts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="neo-btn p-1 bg-white text-[#1E1E1E]"
              >
                ✕
              </button>
            </div>

            {/* List of Questions and Specific Participant Answer */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {currentEvent.questions.map((q, idx) => {
                const ans = getParticipantAnswerForQuestion(selectedParticipant.id, q);

                return (
                  <div key={q.id} className="p-3.5 bg-[#FFF8F0] rounded-lg border-2 border-[#1E1E1E] space-y-1.5" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#4F46E5] font-mono">
                        Soal {idx + 1} ({q.type.replace('_', ' ')})
                      </span>
                      {ans.answered ? (
                        <span className="neo-badge bg-[#34D399] text-[#1E1E1E] text-[10px]">
                          Dijawab ({ans.timeTaken || 0}s)
                        </span>
                      ) : (
                        <span className="neo-badge bg-gray-200 text-gray-600 text-[10px]">
                          Lewat
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-black text-[#1E1E1E]">
                      {q.title}
                    </p>

                    <div className="p-2.5 bg-white rounded-lg border-2 border-[#1E1E1E] text-xs font-medium text-[#1E1E1E]">
                      <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5 font-mono">Jawaban {selectedParticipant.name}:</span>
                      <span className="font-bold text-[#4F46E5]">"{ans.text}"</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t-2 border-[#1E1E1E]/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="neo-btn px-4 py-2 bg-[#FACC15] text-[#1E1E1E] font-black text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA RESET MODAL */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-md neo-card p-5 space-y-3.5 animate-in fade-in">
            <div className="flex items-center space-x-2.5 text-[#FB7185]">
              <div className="p-2 bg-[#FB7185] text-[#1E1E1E] border-2 border-[#1E1E1E] rounded-lg" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1E1E1E] uppercase font-display">Reset Session Responses?</h3>
                <p className="text-[11px] text-gray-500 font-mono">This will clear all participant votes for this event.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-mono">
              Are you sure you want to reset <strong className="text-[#1E1E1E]">{currentEvent.title}</strong>? All {totalResponses} responses will be cleared for a new session.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-[#1E1E1E]/10">
              <button
                type="button"
                onClick={() => setShowCleanupModal(false)}
                className="neo-btn px-3.5 py-1.5 bg-white text-[#1E1E1E] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="neo-btn px-3.5 py-1.5 bg-[#FB7185] text-[#1E1E1E] font-black text-xs"
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
