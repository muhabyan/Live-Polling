import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { EventData, Question, QuestionType } from '../../types';
import { AiGeneratingSpinner } from '../Shared/Loaders';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Play, 
  Tv, 
  BarChart3, 
  Sparkles, 
  Layers, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  X,
  FileText,
  HelpCircle
} from 'lucide-react';
import * as api from '../../utils/api';

export const AdminDashboard: React.FC = () => {
  const { 
    events, 
    setCurrentEventId, 
    setActiveView, 
    refreshEvent 
  } = useEvent();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('Conference Attendees & Professionals');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Form state for creating / editing event
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Workshop / Seminar');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formQuestions, setFormQuestions] = useState<Question[]>([
    {
      id: 'q-new-1',
      type: 'multiple_choice',
      title: 'What is your primary goal for today’s session?',
      subtitle: 'Select one option',
      timerSeconds: 45,
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
    setFormCategory('Workshop / Seminar');
    setFormOrganizer('Event Host');
    setFormDescription('');
    setFormQuestions([
      {
        id: 'q-1',
        type: 'multiple_choice',
        title: 'What is your primary objective today?',
        timerSeconds: 45,
        options: [
          { id: 'opt-1', text: 'Gain practical technical insights', isCorrect: false },
          { id: 'opt-2', text: 'Explore strategic industry trends', isCorrect: false },
          { id: 'opt-3', text: 'Connect with expert speakers', isCorrect: false },
        ],
      },
      {
        id: 'q-2',
        type: 'rating',
        title: 'How relevant is today’s topic to your current projects?',
        timerSeconds: 30,
        ratingMin: 1,
        ratingMax: 5,
        ratingMinLabel: 'Not Relevant',
        ratingMaxLabel: 'Extremely Critical',
      }
    ]);
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      await api.createNewEvent({
        title: formTitle.trim(),
        category: formCategory,
        organizerName: formOrganizer.trim() || 'Moderator',
        description: formDescription.trim(),
        questions: formQuestions,
      });
      await refreshEvent();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteEventById(id);
        await refreshEvent();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDuplicateEvent = async (evt: EventData, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.createNewEvent({
        title: `${evt.title} (Copy)`,
        category: evt.category,
        organizerName: evt.organizerName,
        description: evt.description,
        questions: JSON.parse(JSON.stringify(evt.questions)),
      });
      await refreshEvent();
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

  // Generate questions with Gemini AI
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Management Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, moderate, and analyze reusable live polling sessions for seminars, classrooms, and conferences.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="admin-create-event-btn"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium rounded-lg text-sm shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Events</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {totalEventsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Managed in organization</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Live Sessions</span>
            <Play className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {activeEventsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for attendee voting</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Participants</span>
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {totalParticipantsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Connected attendees</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Responses</span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-semibold text-slate-900 font-mono-numbers">
            {totalResponsesCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live audience data points</p>
        </div>
      </div>

      {/* Event List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Events & Polls</h2>
          <span className="text-xs text-slate-400 font-medium">{events.length} total</span>
        </div>

        <div className="divide-y divide-slate-100">
          {events.map((evt) => {
            const isLive = evt.status === 'live';
            const isWaiting = evt.status === 'waiting';

            return (
              <div
                key={evt.id}
                onClick={() => setCurrentEventId(evt.id)}
                className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Event Details */}
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-semibold font-mono tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {evt.roomCode}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 hover:text-slate-600 transition-colors">
                      {evt.title}
                    </h3>
                    {isLive && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-semibold tracking-wider animate-pulse">
                        LIVE
                      </span>
                    )}
                    {isWaiting && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold border border-slate-200">
                        WAITING
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {evt.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium pt-1">
                    <span>{evt.category}</span>
                    <span>•</span>
                    <span>{evt.questions.length} questions</span>
                    <span>•</span>
                    <span>{evt.participants.length} participants</span>
                    <span>•</span>
                    <span>{evt.responses.length} responses</span>
                  </div>
                </div>

                {/* Event Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Launch Live Presenter */}
                  <button
                    onClick={() => {
                      setCurrentEventId(evt.id);
                      setActiveView('presenter');
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
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
                    className="flex items-center space-x-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
                    title="Open Projector Display"
                  >
                    <Tv className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Projector</span>
                  </button>

                  {/* Analytics & Export */}
                  <button
                    onClick={() => {
                      setCurrentEventId(evt.id);
                      setActiveView('analytics');
                    }}
                    className="flex items-center space-x-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Report</span>
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={(e) => handleDuplicateEvent(evt, e)}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
                    title="Duplicate Event"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDeleteEvent(evt.id, e)}
                    className="p-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:border-rose-200 hover:text-rose-600 rounded-lg shadow-sm transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE EVENT MODAL WITH QUESTION BUILDER & AI GENERATOR */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Interactive Event</h3>
                  <p className="text-xs text-slate-500">Configure questions, timer, and question types</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold shadow-sm border border-slate-200 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>AI Question Generator</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEvent} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Event Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Annual Product Roadmap Keynote 2026"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Conference, Classroom, Workshop"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organizer / Moderator
                  </label>
                  <input
                    type="text"
                    value={formOrganizer}
                    onChange={(e) => setFormOrganizer(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Short summary of the session agenda..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Question Sequence Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Question Sequence ({formQuestions.length})</h4>
                    <p className="text-xs text-slate-400">Questions will be presented in this order</p>
                  </div>

                  {/* Add Question Dropdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('multiple_choice')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      + Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('word_cloud')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      + Word Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('rating')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      + Rating
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('open_text')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      + Open Text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToForm('true_false')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      + True/False
                    </button>
                  </div>
                </div>

                {/* Question Cards List */}
                <div className="space-y-3">
                  {formQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Q{idx + 1} • {q.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <select
                              value={q.timerSeconds}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormQuestions(prev => prev.map((item, i) => i === idx ? { ...item, timerSeconds: val } : item));
                              }}
                              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-bold"
                            >
                              <option value={15}>15s</option>
                              <option value={30}>30s</option>
                              <option value={45}>45s</option>
                              <option value={60}>60s</option>
                              <option value={90}>90s</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionFromForm(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      />

                      {/* Options for Multiple Choice */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1.5 pl-2">
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={opt.id || optIdx} className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-400 w-4">{['A', 'B', 'C', 'D'][optIdx]}</span>
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
                                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs shadow-md transition-colors"
                >
                  Save & Launch Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GEMINI AI QUESTION GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-extrabold text-slate-900">Gemini AI Poll Generator</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Describe your presentation topic and Gemini will create interactive multiple choice, word cloud, and rating questions.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seminar / Workshop Topic *
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. AI-Assisted Software Development, Modern Leadership"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
                placeholder="e.g. University Students, Tech Executives"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              id="gemini-generate-submit-btn"
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGeneratingAI || !aiTopic.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <AiGeneratingSpinner size="w-5 h-5" color="text-white" />
                  <span className="animate-pulse tracking-wider ml-2">GENERATING AI POLLS</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 4 Interactive Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
