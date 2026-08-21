import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { EventData, Participant, ActiveAppView, Question, ResponseItem, LiveReaction } from '../types';
import { dbQuestionToFrontend, dbParticipantToFrontend, dbResponseToFrontend, dbReactionToFrontend } from '../types';
import type { DbQuestion, DbParticipant, DbResponse, DbReaction, DbEvent } from '../types';
import { dbEventToFrontend } from '../types';
import * as api from '../utils/api';
import { initLocalSync, broadcastLocalSync } from '../utils/localSync';
import confetti from 'canvas-confetti';
import type { Session, User } from '@supabase/supabase-js';

interface EventContextType {
  // Auth
  session: Session | null;
  user: User | null;
  isHost: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginAsDemoHost: () => void;
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
  deleteEvent: (id: string) => Promise<void>;
  deleteParticipant: (participantId: string) => Promise<void>;
  clearAllParticipants: () => Promise<void>;
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
  const [isDemoHost, setIsDemoHost] = useState(false);
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

  // Check URL params on initial load (e.g. ?view=projector or ?code=PULSE88)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ActiveAppView;
    if (viewParam && ['projector', 'participant', 'presenter', 'admin', 'analytics'].includes(viewParam)) {
      if (['presenter', 'admin', 'analytics'].includes(viewParam)) {
        setIsDemoHost(true);
      }
      setActiveViewState(viewParam);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsAuthLoading(false);
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (s?.user && !viewParam) {
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
      await refreshAllEvents();
      setActiveViewState('presenter');
    } catch {
      // Allow fallback demo host login
      setIsDemoHost(true);
      await refreshAllEvents();
      setActiveViewState('presenter');
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

  const loginAsDemoHost = () => {
    setIsDemoHost(true);
    setActiveViewState('presenter');
  };

  const logout = async () => {
    setIsDemoHost(false);
    await api.signOut().catch(() => {});
    setActiveViewState('participant');
  };

  // ============================================
  // VIEW MANAGEMENT (auth-aware)
  // ============================================

  const setActiveView = (view: ActiveAppView) => {
    if (['presenter', 'admin', 'analytics'].includes(view) && !session && !isDemoHost) {
      setActiveViewState('login');
      return;
    }
    setActiveViewState(view);
  };

  // ============================================
  // DATA LOADING & AUTO-SEED
  // ============================================

  const refreshAllEvents = useCallback(async () => {
    try {
      const data = await api.fetchAllEvents();
      setEvents(data);
      broadcastLocalSync({ type: 'SYNC_ALL_EVENTS', events: data });
      if (data.length > 0) {
        setCurrentEventIdState(prev => {
          const stillExists = data.some(e => e.id === prev);
          return stillExists ? prev : data[0].id;
        });
      } else {
        setCurrentEventIdState('');
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  // LOCAL REALTIME SYNC (Phone <-> Laptop <-> Projector)
  // ============================================
  useEffect(() => {
    const unsubscribe = initLocalSync((msg) => {
      if (msg.type === 'INIT_STATE' || msg.type === 'ALL_EVENTS_UPDATED') {
        if (msg.events && msg.events.length > 0) {
          setEvents(msg.events);
          setCurrentEventIdState((prev) => {
            const exists = msg.events.some((e: EventData) => e.id === prev);
            return exists ? prev : msg.events[0].id;
          });
        }
      } else if (msg.type === 'PARTICIPANT_JOINED') {
        setEvents((prev) =>
          prev.map((evt) => {
            if (evt.id !== msg.eventId && evt.roomCode.toUpperCase() !== msg.roomCode?.toUpperCase()) return evt;
            if (evt.participants.some((p) => p.id === msg.participant.id)) return evt;
            return { ...evt, participants: [...evt.participants, msg.participant] };
          })
        );
      } else if (msg.type === 'RESPONSE_SUBMITTED') {
        setEvents((prev) =>
          prev.map((evt) => {
            if (evt.id !== msg.eventId) return evt;
            const filtered = evt.responses.filter(
              (r) => !(r.participantId === msg.response.participantId && r.questionId === msg.response.questionId)
            );
            return { ...evt, responses: [...filtered, msg.response] };
          })
        );
      } else if (msg.type === 'MODERATOR_ACTION_BROADCAST') {
        setEvents((prev) =>
          prev.map((evt) => {
            if (evt.id !== msg.eventId) return evt;
            return { ...evt, ...msg.updatedFields };
          })
        );
      } else if (msg.type === 'REACTION_SENT') {
        const newReaction: LiveReaction = {
          id: 'r-' + Date.now(),
          event_id: msg.eventId,
          emoji: msg.emoji,
          senderName: msg.name || 'Attendee',
          timestamp: Date.now(),
        };
        setEvents((prev) =>
          prev.map((evt) => {
            if (evt.id !== msg.eventId) return evt;
            return { ...evt, reactions: [newReaction, ...evt.reactions].slice(0, 25) };
          })
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // ============================================
  // SUPABASE REALTIME SUBSCRIPTIONS
  // ============================================

  // 1. Global subscription for new/deleted events only (NOT updates — those are handled per-event)
  useEffect(() => {
    const globalChannel = supabase
      .channel('global-events-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        () => {
          refreshAllEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events' },
        () => {
          refreshAllEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [refreshAllEvents]);

  // 2. Active event specific real-time channel
  useEffect(() => {
    if (!currentEventId) return;

    const channel = supabase
      .channel(`event-live-${currentEventId}`)
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
              const filtered = evt.responses.filter(
                r => !(r.participantId === newResponse.participantId && r.questionId === newResponse.questionId)
              );
              return { ...evt, responses: [...filtered, newResponse] };
            })
          );
        }
      )
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
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'responses',
          filter: `event_id=eq.${currentEventId}`,
        },
        () => {
          refreshEvent();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${currentEventId}`,
        },
        () => {
          refreshEvent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEventId, refreshEvent]);

  // 3. Periodic lightweight heartbeat polling (ensures participants & responses stay 100% in sync even if websockets drop)
  useEffect(() => {
    if (!currentEventId) return;
    const interval = setInterval(() => {
      refreshEvent();
    }, 3000);
    return () => clearInterval(interval);
  }, [currentEventId, refreshEvent]);

  // ============================================
  // SYNCHRONIZED COUNTDOWN TIMER TICKER
  // ============================================

  useEffect(() => {
    if (!currentEvent?.id || !currentEvent.isTimerRunning) return;

    const timer = setInterval(() => {
      setEvents(prev =>
        prev.map(evt => {
          if (evt.id !== currentEvent.id) return evt;
          const currentQ = evt.questions[evt.currentQuestionIndex];
          const defaultDuration = currentQ?.timerSeconds || 45;
          const currentRemaining = evt.timerRemainingSeconds ?? defaultDuration;
          if (currentRemaining <= 1) {
            return {
              ...evt,
              timerRemainingSeconds: 0,
              isTimerRunning: false,
              isVotingLocked: true,
            };
          }
          return {
            ...evt,
            timerRemainingSeconds: currentRemaining - 1,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [currentEvent?.id, currentEvent?.isTimerRunning]);

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
      // Broadcast to all devices locally in real-time
      broadcastLocalSync({
        type: 'PARTICIPANT_JOINED',
        eventId: res.eventId,
        roomCode: code.toUpperCase(),
        participant: res.participant,
      });

      if (res.eventId) {
        setCurrentEventIdState(res.eventId);
        const fullEvent = await api.fetchFullEvent(res.eventId);
        if (fullEvent) {
          if (!fullEvent.participants.some(p => p.id === res.participant.id)) {
            fullEvent.participants = [...fullEvent.participants, res.participant];
          }
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

    // Optimistically insert response into state so participant UI immediately confirms
    const optimisticResp: ResponseItem = {
      id: 'resp-' + Date.now(),
      event_id: currentEvent.id,
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      questionId: payload.questionId,
      selectedOptionIds: payload.selectedOptionIds || [],
      textResponse: payload.textResponse,
      ratingValue: payload.ratingValue,
      timeTakenSeconds: payload.timeTakenSeconds || 0,
      submittedAt: Date.now(),
    };

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== currentEvent.id) return evt;
        const filtered = evt.responses.filter(
          r => !(r.participantId === currentParticipant.id && r.questionId === payload.questionId)
        );
        return {
          ...evt,
          responses: [...filtered, optimisticResp],
        };
      })
    );

    // Broadcast submission to Laptop, Projector, and other devices in real-time
    broadcastLocalSync({
      type: 'RESPONSE_SUBMITTED',
      eventId: currentEvent.id,
      response: optimisticResp,
    });

    try {
      await api.submitQuestionResponse(currentEvent.id, {
        participantId: currentParticipant.id,
        participantName: currentParticipant.name,
        ...payload,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
      throw err;
    }
  };

  const sendModeratorAction = async (action: string, payload?: any) => {
    if (!currentEvent) return;

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== currentEvent.id) return evt;
        const qIdx = evt.currentQuestionIndex ?? 0;
        const getQTimer = (idx: number) => evt.questions[idx]?.timerSeconds || 45;

        switch (action) {
          case 'start_session':
            return {
              ...evt,
              status: 'live',
              isTimerRunning: true,
              isVotingLocked: false,
              timerRemainingSeconds: evt.timerRemainingSeconds ?? getQTimer(qIdx),
            };
          case 'end_session':
            return {
              ...evt,
              status: 'ended',
              isTimerRunning: false,
            };
          case 'reset_session':
          case 'clear_room':
            return {
              ...evt,
              status: 'waiting',
              currentQuestionIndex: 0,
              isTimerRunning: false,
              isVotingLocked: false,
              showResultsOnProjector: true,
              revealAnswer: false,
              timerRemainingSeconds: getQTimer(0),
              participants: [],
              responses: [],
              reactions: [],
            };
          case 'next_question': {
            const nextIdx = Math.min(evt.questions.length - 1, qIdx + 1);
            return {
              ...evt,
              currentQuestionIndex: nextIdx,
              timerRemainingSeconds: getQTimer(nextIdx),
              isTimerRunning: false, // Paused so presenter can introduce question
              isVotingLocked: false,
              revealAnswer: false,
            };
          }
          case 'prev_question': {
            const prevIdx = Math.max(0, qIdx - 1);
            return {
              ...evt,
              currentQuestionIndex: prevIdx,
              timerRemainingSeconds: getQTimer(prevIdx),
              isTimerRunning: false,
              isVotingLocked: false,
              revealAnswer: false,
            };
          }
          case 'jump_to_question': {
            const jumpIdx = Math.max(0, Math.min(evt.questions.length - 1, payload?.index ?? 0));
            return {
              ...evt,
              currentQuestionIndex: jumpIdx,
              timerRemainingSeconds: getQTimer(jumpIdx),
              isTimerRunning: false,
              isVotingLocked: false,
              revealAnswer: false,
            };
          }
          case 'reset_timer':
            return {
              ...evt,
              timerRemainingSeconds: getQTimer(qIdx),
              isTimerRunning: false, // STOPPED until presenter clicks Start Timer!
              isVotingLocked: false,
            };
          case 'toggle_timer':
            return {
              ...evt,
              isTimerRunning: !evt.isTimerRunning,
            };
          case 'start_timer':
            return {
              ...evt,
              isTimerRunning: true,
            };
          case 'stop_timer':
          case 'pause_timer':
            return {
              ...evt,
              isTimerRunning: false,
            };
          case 'add_time':
            return {
              ...evt,
              timerRemainingSeconds: (evt.timerRemainingSeconds ?? getQTimer(qIdx)) + (payload?.seconds || 15),
            };
          case 'lock_voting':
          case 'toggle_lock_voting':
            return {
              ...evt,
              isVotingLocked: !evt.isVotingLocked,
            };
          case 'reveal_answer':
          case 'toggle_reveal_answer':
            return {
              ...evt,
              revealAnswer: !evt.revealAnswer,
            };
          case 'toggle_results':
            return {
              ...evt,
              showResultsOnProjector: payload?.show ?? !evt.showResultsOnProjector,
            };
          default:
            return evt;
        }
      })
    );

    const qIdx = currentEvent.currentQuestionIndex ?? 0;
    const getQTimer = (idx: number) => currentEvent.questions[idx]?.timerSeconds || 45;
    let targetTimerSeconds: number | undefined;

    if (action === 'reset_timer') {
      targetTimerSeconds = getQTimer(qIdx);
    } else if (action === 'next_question') {
      const nextIdx = Math.min(currentEvent.questions.length - 1, qIdx + 1);
      targetTimerSeconds = getQTimer(nextIdx);
    } else if (action === 'prev_question') {
      const prevIdx = Math.max(0, qIdx - 1);
      targetTimerSeconds = getQTimer(prevIdx);
    } else if (action === 'jump_to_question') {
      const jumpIdx = Math.max(0, Math.min(currentEvent.questions.length - 1, payload?.index ?? 0));
      targetTimerSeconds = getQTimer(jumpIdx);
    } else if (action === 'start_session' || action === 'reset_session') {
      targetTimerSeconds = getQTimer(0);
    }

    const enrichedPayload = {
      ...payload,
      timerSeconds: targetTimerSeconds ?? payload?.timerSeconds,
    };

    // Broadcast updated state to all connected devices locally
    const updatedEvt = events.find(e => e.id === currentEvent.id);
    if (updatedEvt) {
      broadcastLocalSync({
        type: 'MODERATOR_ACTION_BROADCAST',
        eventId: currentEvent.id,
        action,
        updatedFields: { ...updatedEvt, timerRemainingSeconds: targetTimerSeconds ?? updatedEvt.timerRemainingSeconds },
      });
    }

    try {
      await api.sendControlAction(currentEvent.id, action, enrichedPayload);
    } catch (err: any) {
      setError(err.message || 'Moderator action failed');
    }
  };

  const sendReaction = (emoji: string) => {
    if (!currentEvent) return;
    const name = currentParticipant?.name || 'Attendee';
    broadcastLocalSync({
      type: 'REACTION_SENT',
      eventId: currentEvent.id,
      emoji,
      name,
    });
    api.sendReactionDirect(currentEvent.id, emoji, name);
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setCurrentEventIdState(prev => {
      const remaining = events.filter(e => e.id !== id);
      return remaining.length > 0 ? remaining[0].id : '';
    });
    await api.deleteEventById(id);
  };

  const deleteParticipant = async (participantId: string) => {
    if (!currentEvent) return;
    setEvents(prev =>
      prev.map(e => {
        if (e.id !== currentEvent.id) return e;
        return {
          ...e,
          participants: e.participants.filter(p => p.id !== participantId),
          responses: e.responses.filter(r => r.participantId !== participantId),
        };
      })
    );
    await api.deleteParticipantById(currentEvent.id, participantId);
  };

  const clearAllParticipants = async () => {
    if (!currentEvent) return;
    setEvents(prev =>
      prev.map(e => {
        if (e.id !== currentEvent.id) return e;
        return {
          ...e,
          participants: [],
          responses: [],
          reactions: [],
        };
      })
    );
    await api.clearAllParticipantsAndResponses(currentEvent.id);
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
        isHost: Boolean(session || isDemoHost),
        isAuthLoading,
        login,
        register,
        loginAsDemoHost,
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
        deleteEvent,
        deleteParticipant,
        clearAllParticipants,
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
