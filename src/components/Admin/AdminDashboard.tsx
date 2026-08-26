import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { EventData, Question, QuestionType } from '../../types';
import { AiGeneratingSpinner } from '../Shared/Loaders';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Play, 
  Tv, 
  BarChart3, 
  Sparkles, 
  Layers, 
  Users, 
  MessageSquare, 
  Clock, 
  X,
  FileText
} from 'lucide-react';
import * as api from '../../utils/api';

export const AdminDashboard: React.FC = () => {
  const { 
    events, 
    setCurrentEventId, 
    setActiveView, 
    refreshAllEvents,
    deleteEvent
  } = useEvent();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('Conference Attendees & Professionals');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Form state for creating / editing event
  const [formTitle, setFormTitle] = useState('');
  const [formRoomCode, setFormRoomCode] = useState('');
  const [formCategory, setFormCategory] = useState('Workshop / Seminar');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsQuizMode, setFormIsQuizMode] = useState<boolean>(false);
  const [formQuestions, setFormQuestions] = useState<Question[]>([
    {
      id: 'q-new-1',
      type: 'multiple_choice',
      title: 'What is your primary goal for today’s session?',
      subtitle: 'Select one option',
      timerSeconds: 45,
      points: 100,
      options: [
        { id: 'opt-1', text: 'Learn new practical skills & tools', isCorrect: false },
        { id: 'opt-2', text: 'Network with industry peers', isCorrect: false },
        { id: 'opt-3', text: 'Get actionable frameworks for our team', isCorrect: false },
      ],
    },
    {
      id: 'q-new-2',
      type: 'word_cloud',
      title: 'In 1 word, what is your current mindset?',
      timerSeconds: 45,
      maxWordCount: 1,
    }
  ]);

  // Total metrics across all events
  const totalEventsCount = events.length;
  const activeEventsCount = events.filter(e => e.status === 'live' || e.status === 'waiting').length;
  const totalParticipantsCount = events.reduce((acc, e) => acc + e.participants.length, 0);
  const totalResponsesCount = events.reduce((acc, e) => acc + e.responses.length, 0);

  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    setFormCategory('Workshop / Seminar');
    setFormOrganizer('');
    setFormDescription('');
    setFormIsQuizMode(false);
    setFormQuestions([
      {
        id: 'q-new-1',
        type: 'multiple_choice',
        title: 'What is your primary goal for today’s session?',
        subtitle: 'Select one option',
        timerSeconds: 45,
        points: 100,
        options: [
          { id: 'opt-1', text: 'Learn new practical skills & tools', isCorrect: false },
          { id: 'opt-2', text: 'Network with industry peers', isCorrect: false },
          { id: 'opt-3', text: 'Get actionable frameworks for our team', isCorrect: false },
        ],
      },
      {
        id: 'q-new-2',
        type: 'word_cloud',
        title: 'In 1 word, what is your current mindset?',
        timerSeconds: 45,
        maxWordCount: 1,
      }
    ]);
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      const newEvt = await api.createNewEvent({
        title: formTitle.trim(),
        roomCode: formRoomCode.trim() || undefined,
        category: formCategory,
        organizerName: formOrganizer.trim() || 'Moderator',
        description: formDescription.trim(),
        isQuizMode: formIsQuizMode,
        questions: formQuestions,
      });
      await refreshAllEvents();
      if (newEvt && newEvt.id) {
        setCurrentEventId(newEvt.id);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this event session?')) {
      try {
        await deleteEvent(id);
      } catch (err) {
        console.error('Delete event error:', err);
      }
    }
  };

  const handleDuplicateEvent = async (evt: EventData, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newEvt = await api.createNewEvent({
        title: `${evt.title} (Copy)`,
        category: evt.category,
        organizerName: evt.organizerName,
        description: evt.description,
        questions: JSON.parse(JSON.stringify(evt.questions)),
      });
      await refreshAllEvents();
      if (newEvt && newEvt.id) {
        setCurrentEventId(newEvt.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestionToForm = (type: QuestionType) => {
    const newQ: Question = {
      id: 'q-' + Date.now(),
      type,
      title: type === 'word_cloud' ? 'Submit 1-2 words describing...' : 'New Question Title',
      timerSeconds: 45,
      options: type === 'multiple_choice' ? [
        { id: 'opt-1', text: 'Option A' },
        { id: 'opt-2', text: 'Option B' },
        { id: 'opt-3', text: 'Option C' },
      ] : type === 'true_false' ? [
        { id: 'tf-1', text: 'True', isCorrect: true },
        { id: 'tf-2', text: 'False', isCorrect: false },
      ] : undefined,
      ratingMin: type === 'rating' ? 1 : undefined,
      ratingMax: type === 'rating' ? 5 : undefined,
      ratingMinLabel: type === 'rating' ? 'Low' : undefined,
      ratingMaxLabel: type === 'rating' ? 'High' : undefined,
    };
    setFormQuestions(prev => [...prev, newQ]);
  };

  const handleRemoveQuestionFromForm = (idx: number) => {
    setFormQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Generate questions with AI
  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingAI(true);
    try {
      const generated = await api.generateAIQuestions(aiTopic, aiAudience, 4);
      if (generated.length > 0) {
        setFormQuestions(generated);
        if (!formTitle) setFormTitle(`${aiTopic} Interactive Poll`);
        setIsAiModalOpen(false);
      }
    } catch (err) {
      console.error('AI question generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1E1E1E] tracking-tight font-display uppercase">
            Admin Studio
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-mono">
            Create, moderate, and manage live polling sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="admin-create-event-btn"
            onClick={handleOpenCreateModal}
            className="neo-btn px-4 py-2 sm:px-5 sm:py-2.5 bg-[#FACC15] text-[#1E1E1E] font-black text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Session</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Total Sessions</span>
            <Layers className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {totalEventsCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Stored events</p>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Active / Live</span>
            <Play className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {activeEventsCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Ready for voting</p>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Participants</span>
            <Users className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {totalParticipantsCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Connected attendees</p>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Total Votes</span>
            <MessageSquare className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E1E1E] font-mono">
            {totalResponsesCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Audience submissions</p>
        </div>
      </div>

      {/* Event List Section */}
      <div className="neo-card overflow-hidden">
        <div className="px-5 py-3.5 border-b-2 border-[#1E1E1E] bg-[#FFF8F0] flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1E1E1E] font-display uppercase">Sessions & Polls</h2>
          <span className="neo-badge bg-white text-[#1E1E1E] font-mono">{events.length} total</span>
        </div>

        {events.length === 0 ? (
          <div className="p-10 text-center text-gray-500 space-y-3">
            <div className="w-12 h-12 bg-[#FACC15] text-[#1E1E1E] border-2 border-[#1E1E1E] rounded-xl flex items-center justify-center mx-auto" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-[#1E1E1E] font-display">No Events Created Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-mono">
              Create your first interactive live polling session or use AI to generate questions in seconds.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="neo-btn px-4 py-2 bg-[#FACC15] text-[#1E1E1E] font-black text-xs inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Event</span>
            </button>
          </div>
        ) : (
          <div className="divide-y-2 divide-[#1E1E1E]">
            {events.map((evt) => {
              const isLive = evt.status === 'live';
              const isWaiting = evt.status === 'waiting';

              return (
                <div
                  key={evt.id}
                  onClick={() => setCurrentEventId(evt.id)}
                  className="p-4 sm:p-5 hover:bg-[#FFF8F0] transition-colors flex flex-col gap-3 cursor-pointer overflow-hidden"
                >
                  {/* Event Details */}
                  <div className="space-y-1 min-w-0 w-full">
                    <div className="flex items-start gap-x-2 gap-y-1 flex-wrap">
                      <span className="neo-badge bg-[#FFF8F0] text-[#1E1E1E] font-mono shrink-0">
                        PIN: {evt.roomCode}
                      </span>
                      {isLive && (
                        <span className="neo-badge bg-[#34D399] text-[#1E1E1E] animate-pulse shrink-0">
                          LIVE
                        </span>
                      )}
                      {isWaiting && (
                        <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] shrink-0">
                          WAITING
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-[#1E1E1E] hover:text-[#4F46E5] transition-colors font-display break-words line-clamp-2">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-1 font-mono">
                      {evt.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 font-bold font-mono pt-0.5">
                      <span>{evt.category}</span>
                      <span>•</span>
                      <span>{evt.questions.length} questions</span>
                      <span>•</span>
                      <span>{evt.participants.length} joined</span>
                      <span>•</span>
                      <span>{evt.responses.length} votes</span>
                    </div>
                  </div>

                  {/* Event Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Launch Live Presenter */}
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setActiveView('presenter');
                      }}
                      className="neo-btn px-3 py-1.5 bg-[#4F46E5] text-white text-xs font-bold"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Presenter</span>
                    </button>

                    {/* Open Projector */}
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setActiveView('projector');
                      }}
                      className="neo-btn px-2.5 py-1.5 bg-white text-[#1E1E1E] text-xs font-bold"
                      title="Open Stage Projector"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Stage</span>
                    </button>

                    {/* Analytics */}
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setActiveView('analytics');
                      }}
                      className="neo-btn px-2.5 py-1.5 bg-white text-[#1E1E1E] text-xs font-bold"
                      title="View Report"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Report</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={(e) => handleDuplicateEvent(evt, e)}
                      className="neo-btn p-1.5 bg-white text-[#1E1E1E]"
                      title="Duplicate Event"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteEvent(evt.id, e)}
                      className="neo-btn p-1.5 bg-white text-[#FB7185] hover:bg-[#FB7185]/20"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl neo-card overflow-hidden my-6 animate-in fade-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#1E1E1E] bg-[#FFF8F0]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#4F46E5] text-white border-2 border-[#1E1E1E] rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1E1E1E] font-display uppercase">Create Polling Session</h3>
                  <p className="text-[11px] text-gray-500 font-mono">Configure questions, timer, and room code</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="neo-btn px-2.5 py-1 bg-[#FACC15] text-[#1E1E1E] text-xs font-black"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Generator</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="neo-btn p-1 bg-white text-[#1E1E1E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEvent} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Event Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-[#1E1E1E] uppercase tracking-wider mb-1 font-mono">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Annual Strategy Keynote 2026"
                    className="neo-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#1E1E1E] uppercase tracking-wider mb-1 font-mono">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Conference, Classroom"
                    className="neo-input w-full text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-black text-[#1E1E1E] uppercase tracking-wider font-mono">
                      Room PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                      className="text-[10px] text-[#4F46E5] font-black font-mono cursor-pointer hover:underline"
                    >
                      🎲 Generate PIN
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formRoomCode}
                    onChange={(e) => setFormRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PULSE88"
                    maxLength={10}
                    className="neo-input w-full text-xs font-mono font-black tracking-widest uppercase"
                  />
                </div>
              </div>

              {/* Mode Sesi: Polling Biasa vs Kuis Berpoin */}
              <div className="pt-2">
                <label className="block text-[11px] font-black text-[#1E1E1E] uppercase tracking-wider mb-1.5 font-mono">
                  Mode Sesi & Penilaian
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsQuizMode(false);
                      setFormQuestions(prev => prev.map(q => ({ ...q, points: undefined })));
                    }}
                    className={`p-3 rounded-lg border-2 border-[#1E1E1E] text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                      !formIsQuizMode 
                        ? 'bg-[#4F46E5]/10 shadow-[2px_2px_0px_#1E1E1E]' 
                        : 'bg-white'
                    }`}
                  >
                    <span className="text-xl shrink-0">📊</span>
                    <div>
                      <div className="text-xs font-black flex items-center space-x-1">
                        <span>Polling & Survey</span>
                        {!formIsQuizMode && <span className="neo-badge bg-[#34D399] text-[#1E1E1E] text-[9px]">✓ Aktif</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight font-mono">
                        Murni voting opini & persentase (Tanpa Poin / Skor).
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormIsQuizMode(true);
                      setFormQuestions(prev => prev.map(q => ({ ...q, points: q.points || 100 })));
                    }}
                    className={`p-3 rounded-lg border-2 border-[#1E1E1E] text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                      formIsQuizMode 
                        ? 'bg-[#FACC15]/20 shadow-[2px_2px_0px_#1E1E1E]' 
                        : 'bg-white'
                    }`}
                  >
                    <span className="text-xl shrink-0">🏆</span>
                    <div>
                      <div className="text-xs font-black flex items-center space-x-1">
                        <span>Kuis & Kompetisi Poin</span>
                        {formIsQuizMode && <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-[9px]">✓ Aktif</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight font-mono">
                        Ada skor jawaban, kunci benar/salah, & Leaderboard.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Question Sequence Builder */}
              <div className="space-y-3 pt-3 border-t-2 border-[#1E1E1E]/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black text-[#1E1E1E] font-display uppercase">Questions ({formQuestions.length})</h4>
                  </div>

                  {/* Add Question Types */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('multiple_choice')}
                      className="neo-btn px-2 py-1 bg-white text-[#1E1E1E] text-[11px] font-bold"
                    >
                      + Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('word_cloud')}
                      className="neo-btn px-2 py-1 bg-white text-[#1E1E1E] text-[11px] font-bold"
                    >
                      + Word Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('rating')}
                      className="neo-btn px-2 py-1 bg-white text-[#1E1E1E] text-[11px] font-bold"
                    >
                      + Rating
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('open_text')}
                      className="neo-btn px-2 py-1 bg-white text-[#1E1E1E] text-[11px] font-bold"
                    >
                      + Open Text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('true_false')}
                      className="neo-btn px-2 py-1 bg-white text-[#1E1E1E] text-[11px] font-bold"
                    >
                      + True/False
                    </button>
                  </div>
                </div>

                {/* Question Cards List */}
                <div className="space-y-2.5">
                  {formQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3.5 rounded-lg bg-[#FFF8F0] border-2 border-[#1E1E1E] space-y-2" style={{ boxShadow: '2px 2px 0px #1E1E1E' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="neo-badge bg-white text-[#1E1E1E] text-[10px] font-mono">
                            Q{idx + 1} • {q.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {formIsQuizMode && (
                            <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-[10px] font-mono">
                              +{q.points || 100} pts
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {formIsQuizMode && (
                            <select
                              value={q.points || 100}
                              onChange={(e) => {
                                const pts = Number(e.target.value);
                                setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, points: pts } : item));
                              }}
                              className="bg-white border-2 border-[#1E1E1E] rounded px-1.5 py-0.5 text-[11px] font-bold text-[#1E1E1E]"
                            >
                              <option value={50}>50 pts</option>
                              <option value={100}>100 pts</option>
                              <option value={200}>200 pts</option>
                            </select>
                          )}
                          <div className="flex items-center space-x-1 text-xs text-gray-600 font-mono font-bold">
                            <Clock className="w-3 h-3" />
                            <select
                              value={q.timerSeconds}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, timerSeconds: val } : item));
                              }}
                              className="bg-white border-2 border-[#1E1E1E] rounded px-1.5 py-0.5 text-xs font-bold"
                            >
                              <option value={15}>15s</option>
                              <option value={30}>30s</option>
                              <option value={45}>45s</option>
                              <option value={60}>60s</option>
                              <option value={90}>90s</option>
                              <option value={120}>120s</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionFromForm(idx)}
                            className="text-gray-400 hover:text-[#FB7185] p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                        }}
                        placeholder="Question title..."
                        className="neo-input w-full text-xs font-bold"
                      />

                      {/* Options for Multiple Choice */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1 pl-1">
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={opt.id || optIdx} className="flex items-center space-x-2">
                              <span className="text-[10px] font-black text-gray-500 w-3 font-mono">{['A', 'B', 'C', 'D'][optIdx]}</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setFormQuestions(prev => prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    const updatedOpts = [...(item.options || [])];
                                    updatedOpts[optIdx] = { ...updatedOpts[optIdx], text };
                                    return { ...item, options: updatedOpts };
                                  }));
                                }}
                                className="flex-1 px-2.5 py-1 bg-white border-2 border-[#1E1E1E] rounded-md text-xs font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rating Scale Customization */}
                      {q.type === 'rating' && (
                        <div className="p-2.5 bg-white border-2 border-[#1E1E1E] rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase font-mono">Tampilan Skala:</label>
                            <select
                              value={q.ratingStyle || 'numeric'}
                              onChange={(e) => {
                                const style = e.target.value as any;
                                setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, ratingStyle: style } : item));
                              }}
                              className="px-2 py-1 bg-[#FFF8F0] border-2 border-[#1E1E1E] rounded-md text-xs font-bold"
                            >
                              <option value="numeric">🔢 Skala Angka (1-5 / 1-10)</option>
                              <option value="likert">📝 Skala Likert (Kata-kata)</option>
                              <option value="stars">⭐ Bintang Rating (1-5)</option>
                              <option value="emoji">😊 Emotikon Sentimen (1-5)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-0.5 font-mono">Label Min (1):</label>
                              <input
                                type="text"
                                value={q.ratingMinLabel || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, ratingMinLabel: val } : item));
                                }}
                                placeholder="e.g. Kurang Yakin"
                                className="w-full px-2 py-1 bg-[#FFF8F0] border-2 border-[#1E1E1E] rounded text-[11px] font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-0.5 font-mono">Label Max (5/10):</label>
                              <input
                                type="text"
                                value={q.ratingMaxLabel || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, ratingMaxLabel: val } : item));
                                }}
                                placeholder="e.g. Sangat Yakin"
                                className="w-full px-2 py-1 bg-[#FFF8F0] border-2 border-[#1E1E1E] rounded text-[11px] font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t-2 border-[#1E1E1E]/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="neo-btn px-3.5 py-2 bg-white text-[#1E1E1E] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neo-btn px-4 py-2 bg-[#FACC15] text-[#1E1E1E] font-black text-xs"
                >
                  Save & Launch Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI QUESTION GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
          <div className="relative w-full max-w-md neo-card p-5 sm:p-6 animate-in fade-in space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#1E1E1E]">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-sm font-black text-[#1E1E1E] font-display uppercase">AI Question Generator</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="neo-btn p-1 bg-white text-[#1E1E1E]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-mono">
              Describe your topic and AI will create interactive polls in seconds.
            </p>

            <div>
              <label className="block text-[11px] font-black text-[#1E1E1E] uppercase tracking-wider mb-1 font-mono">
                Topic *
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Modern Web Development, Leadership Skills"
                className="neo-input w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#1E1E1E] uppercase tracking-wider mb-1 font-mono">
                Target Audience
              </label>
              <input
                type="text"
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
                placeholder="e.g. University Students, Tech Professionals"
                className="neo-input w-full text-xs"
              />
            </div>

            <button
              id="gemini-generate-submit-btn"
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGeneratingAI || !aiTopic.trim()}
              className="neo-btn w-full py-2.5 bg-[#FACC15] text-[#1E1E1E] font-black text-xs"
            >
              {isGeneratingAI ? (
                <>
                  <AiGeneratingSpinner size="w-4 h-4" color="text-[#1E1E1E]" />
                  <span className="tracking-wide ml-1 font-mono">GENERATING QUESTIONS...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate 4 Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
