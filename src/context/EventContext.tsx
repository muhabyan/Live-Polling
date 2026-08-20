import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { EventData, Participant, ActiveAppView, Question, ResponseItem, LiveReaction } from '../types';
import { dbQuestionToFrontend, dbParticipantToFrontend, dbResponseToFrontend, dbReactionToFrontend } from '../types';
import type { DbQuestion, DbParticipant, DbResponse, DbReaction, DbEvent } from '../types';
import { dbEventToFrontend } from '../types';
import * as api from '../utils/api';
import confetti from 'canvas-confetti';
import type { Session, User } from '@supabase/supabase-js';

interface EventContextType {
  // Auth
  session: Session | null;
  user: User | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data
  events: EventData[];
  currentEvent: EventData | null;
  activeView: ActiveAppView;
  currentParticipant: Participant | null;
  isLoading: boolean;
  error: string | null;
  isSimulatingCrowd: boolean;

  // Actions
  setActiveView: (view: ActiveAppView) => void;
  setCurrentEventId: (id: string) => void;
  refreshEvent: () => Promise<void>;
  refreshAllEvents: () => Promise<void>;
  joinRoom: (code: string, name: string, emoji?: string) => Promise<void>;
  leaveRoom: () => void;
  submitAnswer: (payload: {
    questionId: string;
    selectedOptionIds?: string[];
    textResponse?: string;
    ratingValue?: number;
    timeTakenSeconds?: number;
  }) => Promise<void>;
  sendModeratorAction: (action: string, payload?: any) => Promise<void>;
  sendReaction: (emoji: string) => void;
  simulateAudienceVotes: (count?: number) => Promise<void>;
  fireConfetti: () => void;
  clearError: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Data state
  const [events, setEvents] = useState<EventData[]>([]);
  const [currentEventId, setCurrentEventIdState] = useState<string>('');
  const [activeView, setActiveViewState] = useState<ActiveAppView>('participant');
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(() => {
    const saved = localStorage.getItem('pulselive_participant');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatingCrowd, setIsSimulatingCrowd] = useState(false);

  // ============================================
  // AUTH MANAGEMENT
  // ============================================

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsAuthLoading(false);
      // If logged in, default to presenter view
      if (s?.user) {
        setActiveViewState('presenter');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await api.signInWithEmail(email, password);
      setActiveViewState('presenter');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    try {
      await api.signUpWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    await api.signOut();
    setActiveViewState('participant');
  };

  // ============================================
  // VIEW MANAGEMENT (auth-aware)
  // ============================================

  const setActiveView = (view: ActiveAppView) => {
    // Only allow presenter/admin/analytics if logged in
    if (['presenter', 'admin', 'analytics'].includes(view) && !session) {
      setActiveViewState('login');
      return;
    }
    setActiveViewState(view);
  };

  // ============================================
  // DATA LOADING
  // ============================================

  const refreshAllEvents = useCallback(async () => {
    try {
      const data = await api.fetchAllEvents();
      setEvents(data);
      if (data.length > 0 && !currentEventId) {
        setCurrentEventIdState(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId]);

  const refreshEvent = useCallback(async () => {
    if (!currentEventId) return;
    try {
      const updated = await api.fetchFullEvent(currentEventId);
      if (updated) {
        setEvents(prev => {
          const exists = prev.some(e => e.id === updated.id);
          if (exists) return prev.map(e => e.id === updated.id ? updated : e);
          return [updated, ...prev];
        });
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    }
  }, [currentEventId]);

  // Initial load
  useEffect(() => {
    refreshAllEvents();
  }, [refreshAllEvents]);

  // Current event derived
  const currentEvent = events.find(e => e.id === currentEventId) || events[0] || null;

  // ============================================
  // SUPABASE REALTIME SUBSCRIPTIONS
  // ============================================

  useEffect(() => {
    if (!currentEventId) return;

    const channel = supabase
      .channel(`event-${currentEventId}`)
      // Listen for event state changes (timer, status, etc.)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${currentEventId}`,
        },
        (payload) => {
          const updatedRow = payload.new as DbEvent;
          setEvents(prev =>
            prev.map(evt => {
              if (evt.id !== currentEventId) return evt;
              // Merge updated event fields while keeping nested arrays
              return {
                ...evt,
                status: updatedRow.status,
                currentQuestionIndex: updatedRow.current_question_index,
                timerRemainingSeconds: updatedRow.timer_remaining_seconds,
                isTimerRunning: updatedRow.is_timer_running,
                isVotingLocked: updatedRow.is_voting_locked,
                showResultsOnProjector: updatedRow.show_results_on_projector,
                revealAnswer: updatedRow.reveal_answer,
                questionStartedAt: updatedRow.question_started_at
                  ? new Date(updatedRow.question_started_at).getTime()
                  : undefined,
              };
            })
          );
        }
      )
      // Listen for new participants joining
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${currentEventId}`,
        },
        (payload) => {
          const newParticipant = dbParticipantToFrontend(payload.new as DbParticipant);
          setEvents(prev =>
            prev.map(evt => {
              if (evt.id !== currentEventId) return evt;
              if (evt.participants.some(p => p.id === newParticipant.id)) return evt;
              return { ...evt, participants: [...evt.participants, newParticipant] };
            })
          );
        }
      )
      // Listen for new responses
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `event_id=eq.${currentEventId}`,
        },
        (payload) => {
          const newResponse = dbResponseToFrontend(payload.new as DbResponse);
          setEvents(prev =>
            prev.map(evt => {
              if (evt.id !== currentEventId) return evt;
              // Replace if same participant+question, otherwise append
              const filtered = evt.responses.filter(
                r => !(r.participantId === newResponse.participantId && r.questionId === newResponse.questionId)
              );
              return { ...evt, responses: [...filtered, newResponse] };
            })
          );
        }
      )
      // Listen for participant score updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${currentEventId}`,
        },
        (payload) => {
          const updated = dbParticipantToFrontend(payload.new as DbParticipant);
          setEvents(prev =>
            prev.map(evt => {
              if (evt.id !== currentEventId) return evt;
              return {
                ...evt,
                participants: evt.participants.map(p => (p.id === updated.id ? updated : p)),
              };
            })
          );
        }
      )
      // Listen for new reactions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `event_id=eq.${currentEventId}`,
        },
        (payload) => {
          const newReaction = dbReactionToFrontend(payload.new as DbReaction);
          setEvents(prev =>
            prev.map(evt => {
              if (evt.id !== currentEventId) return evt;
              return { ...evt, reactions: [newReaction, ...evt.reactions].slice(0, 25) };
            })
          );
        }
      )
      // Listen for response deletions (reset session)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'responses',
          filter: `event_id=eq.${currentEventId}`,
        },
        () => {
          // On mass delete (reset), reload full event
          refreshEvent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEventId, refreshEvent]);

  // ============================================
  // USER ACTIONS
  // ============================================

  const setCurrentEventId = (id: string) => {
    setCurrentEventIdState(id);
  };

  const joinRoom = async (code: string, name: string, emoji?: string) => {
    setError(null);
    try {
      const res = await api.joinEventByCode(code, name, emoji);
      setCurrentParticipant(res.participant);
      localStorage.setItem('pulselive_participant', JSON.stringify(res.participant));
      if (res.eventId) {
        setCurrentEventIdState(res.eventId);
        // Refresh to load full event
        const fullEvent = await api.fetchFullEvent(res.eventId);
        if (fullEvent) {
          setEvents(prev => {
            const exists = prev.some(e => e.id === fullEvent.id);
            return exists ? prev.map(e => e.id === fullEvent.id ? fullEvent : e) : [fullEvent, ...prev];
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not join room. Please check the code.');
      throw err;
    }
  };

  const leaveRoom = () => {
    setCurrentParticipant(null);
    localStorage.removeItem('pulselive_participant');
  };

  const submitAnswer = async (payload: {
    questionId: string;
    selectedOptionIds?: string[];
    textResponse?: string;
    ratingValue?: number;
    timeTakenSeconds?: number;
  }) => {
    if (!currentEvent || !currentParticipant) return;
    try {
      await api.submitQuestionResponse(currentEvent.id, {
        participantId: currentParticipant.id,
        participantName: currentParticipant.name,
        ...payload,
      });
      // Realtime subscription will handle UI update
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
      throw err;
    }
  };

  const sendModeratorAction = async (action: string, payload?: any) => {
    if (!currentEvent) return;
    try {
      await api.sendControlAction(currentEvent.id, action, payload);
      // Realtime subscription will handle UI update
    } catch (err: any) {
      setError(err.message || 'Moderator action failed');
    }
  };

  const sendReaction = (emoji: string) => {
    if (!currentEvent) return;
    const name = currentParticipant?.name || 'Attendee';
    // Direct Supabase insert for speed
    api.sendReactionDirect(currentEvent.id, emoji, name);
  };

  const simulateAudienceVotes = async (count: number = 10) => {
    if (!currentEvent) return;
    setIsSimulatingCrowd(true);
    try {
      await sendModeratorAction('simulate_crowd', { count });
    } finally {
      setTimeout(() => setIsSimulatingCrowd(false), 800);
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
    });
  };

  const clearError = () => setError(null);

  return (
    <EventContext.Provider
      value={{
        session,
        user,
        isAuthLoading,
        login,
        register,
        logout,
        events,
        currentEvent,
        activeView,
        currentParticipant,
        isLoading,
        error,
        isSimulatingCrowd,
        setActiveView,
        setCurrentEventId,
        refreshEvent,
        refreshAllEvents,
        joinRoom,
        leaveRoom,
        submitAnswer,
        sendModeratorAction,
        sendReaction,
        simulateAudienceVotes,
        fireConfetti,
        clearError,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
