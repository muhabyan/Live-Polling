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
  FileText,
  HelpCircle,
  TrendingUp,
  Activity
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
            Event Management Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, moderate, and analyze reusable live polling sessions for seminars, classrooms, and conferences.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="admin-create-event-btn"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Session</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Sessions</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {totalEventsCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Stored events</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Lobby / Live</span>
            <Play className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {activeEventsCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Ready for voting</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Participants</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {totalParticipantsCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Connected attendees</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Votes</span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {totalResponsesCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Audience submissions</p>
        </div>
      </div>

      {/* Event List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 font-display">Sessions & Polls</h2>
          <span className="text-xs text-slate-400 font-semibold">{events.length} total</span>
        </div>

        {events.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Events Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first interactive live polling session or use AI to generate questions in seconds.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Event</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => {
              const isLive = evt.status === 'live';
              const isWaiting = evt.status === 'waiting';

              return (
                <div
                  key={evt.id}
                  onClick={() => setCurrentEventId(evt.id)}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5 cursor-pointer"
                >
                  {/* Event Details */}
                  <div className="space-y-1 max-w-xl min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[11px] font-bold font-mono-numbers tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {evt.roomCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate font-display">
                        {evt.title}
                      </h3>
                      {isLive && (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold tracking-wider animate-pulse">
                          LIVE
                        </span>
                      )}
                      {isWaiting && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200">
                          WAITING
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {evt.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-0.5">
                      <span>{evt.category}</span>
                      <span>•</span>
                      <span>{evt.questions.length} questions</span>
                      <span>•</span>
                      <span className="font-mono-numbers">{evt.participants.length} joined</span>
                      <span>•</span>
                      <span className="font-mono-numbers">{evt.responses.length} votes</span>
                    </div>
                  </div>

                  {/* Event Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Launch Live Presenter */}
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setActiveView('presenter');
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
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
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      title="Open Stage Projector"
                    >
                      <Tv className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Stage</span>
                    </button>

                    {/* Analytics */}
                    <button
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setActiveView('analytics');
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      title="View Report"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Report</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={(e) => handleDuplicateEvent(evt, e)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      title="Duplicate Event"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteEvent(evt.id, e)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:border-rose-200 hover:text-rose-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Create Polling Session</h3>
                  <p className="text-[11px] text-slate-500">Configure questions, timer, and room code</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Generator</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Annual Strategy Keynote 2026"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Conference, Classroom"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Room PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono-numbers tracking-widest text-indigo-700 focus:bg-white focus:border-indigo-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Mode Sesi: Polling Biasa vs Kuis Berpoin */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mode Sesi & Penilaian
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsQuizMode(false);
                      setFormQuestions(prev => prev.map(q => ({ ...q, points: undefined })));
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                      !formIsQuizMode 
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-2 ring-indigo-600/20 shadow-2xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">📊</span>
                    <div>
                      <div className="text-xs font-bold flex items-center space-x-1">
                        <span>Polling & Survey</span>
                        {!formIsQuizMode && <span className="text-[10px] text-indigo-600 font-bold">✓ Aktif</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
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
                    className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                      formIsQuizMode 
                        ? 'bg-amber-50/80 border-amber-600 text-amber-950 ring-2 ring-amber-600/20 shadow-2xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">🏆</span>
                    <div>
                      <div className="text-xs font-bold flex items-center space-x-1">
                        <span>Kuis & Kompetisi Poin</span>
                        {formIsQuizMode && <span className="text-[10px] text-amber-600 font-bold">✓ Aktif</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        Ada skor jawaban, kunci benar/salah, & Leaderboard.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Question Sequence Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-display">Questions ({formQuestions.length})</h4>
                  </div>

                  {/* Add Question Types */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('multiple_choice')}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('word_cloud')}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Word Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('rating')}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Rating
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('open_text')}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Open Text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('true_false')}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + True/False
                    </button>
                  </div>
                </div>

                {/* Question Cards List */}
                <div className="space-y-2.5">
                  {formQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Q{idx + 1} • {q.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {formIsQuizMode && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
                              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-700"
                            >
                              <option value={50}>50 pts</option>
                              <option value={100}>100 pts</option>
                              <option value={200}>200 pts</option>
                            </select>
                          )}
                          <div className="flex items-center space-x-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <select
                              value={q.timerSeconds}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, timerSeconds: val } : item));
                              }}
                              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold"
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
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
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
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                      />

                      {/* Options for Multiple Choice */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1 pl-1">
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={opt.id || optIdx} className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-400 w-3">{['A', 'B', 'C', 'D'][optIdx]}</span>
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
                                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rating Scale Customization */}
                      {q.type === 'rating' && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tampilan Skala:</label>
                            <select
                              value={q.ratingStyle || 'numeric'}
                              onChange={(e) => {
                                const style = e.target.value as any;
                                setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, ratingStyle: style } : item));
                              }}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold"
                            >
                              <option value="numeric">🔢 Skala Angka (1-5 / 1-10)</option>
                              <option value="likert">📝 Skala Likert (Kata-kata)</option>
                              <option value="stars">⭐ Bintang Rating (1-5)</option>
                              <option value="emoji">😊 Emotikon Sentimen (1-5)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Label Nilai Minimum (1):</label>
                              <input
                                type="text"
                                value={q.ratingMinLabel || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, ratingMinLabel: val } : item));
                                }}
                                placeholder="e.g. Kurang Yakin / Ragu"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Label Nilai Maksimum (5/10):</label>
                              <input
                                type="text"
                                value={q.ratingMaxLabel || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, ratingMaxLabel: val } : item));
                                }}
                                placeholder="e.g. Sangat Yakin"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 animate-in fade-in space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 font-display">AI Question Generator</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Describe your topic and AI will create interactive multiple choice, word cloud, rating, and true/false polls.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seminar / Presentation Topic *
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Modern Web Development, Leadership Skills"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
                placeholder="e.g. University Students, Tech Professionals"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <button
              id="gemini-generate-submit-btn"
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGeneratingAI || !aiTopic.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAI ? (
                <>
                  <AiGeneratingSpinner size="w-4 h-4" color="text-white" />
                  <span className="tracking-wide ml-1">GENERATING QUESTIONS...</span>
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
