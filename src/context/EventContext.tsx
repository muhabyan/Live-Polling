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
  logout: () => Promise<void>;

  // Data
  events: EventData[];
  currentEvent: EventData | null;
  activeView: ActiveAppView;
  currentParticipant: Participant | null;
  isLoading: boolean;
  error: string | null;
  isSimulatingCrowd: boolean;

  // Auto-Advance (Auto-Pilot)
  autoAdvance: boolean;
  setAutoAdvance: (on: boolean) => void;
  autoAdvanceDelay: number; // seconds to wait after timer expires before advancing
  setAutoAdvanceDelay: (seconds: number) => void;
  autoAdvanceCountdown: number | null; // null = not counting, number = seconds remaining

  // Actions
  setActiveView: (view: ActiveAppView) => void;
  setCurrentEventId: (id: string) => void;
  refreshEvent: () => Promise<void>;
  refreshAllEvents: () => Promise<void>;
  joinRoom: (code: string, name: string, emoji?: string, bgColor?: string) => Promise<void>;
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

  // Auto-Advance (Auto-Pilot) state
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(5); // default 5 seconds pause
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const getViewFromLocation = (): ActiveAppView | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace('#', '') as ActiveAppView;
    if (['projector', 'participant', 'presenter', 'admin', 'analytics', 'login'].includes(hash)) {
      return hash;
    }
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ActiveAppView;
    if (viewParam && ['projector', 'participant', 'presenter', 'admin', 'analytics', 'login'].includes(viewParam)) {
      return viewParam;
    }
    return null;
  };

  // ============================================
  // AUTH MANAGEMENT & BROWSER HISTORY SYNC
  // ============================================

  // Sync state with browser back/forward gestures (Android/iOS Swipe Back & Browser Back button)
  useEffect(() => {
    const handleNavigationChange = () => {
      const target = getViewFromLocation();
      if (target) {
        setActiveViewState(target);
      }
    };

    window.addEventListener('popstate', handleNavigationChange);
    window.addEventListener('hashchange', handleNavigationChange);

    // Initial mount sync
    const initialView = getViewFromLocation();
    if (initialView) {
      setActiveViewState(initialView);
      if (window.location.hash !== '#' + initialView) {
        window.history.replaceState({ view: initialView }, '', '#' + initialView);
      }
    }

    return () => {
      window.removeEventListener('popstate', handleNavigationChange);
      window.removeEventListener('hashchange', handleNavigationChange);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsAuthLoading(false);
      const initialView = getViewFromLocation();
      if (s?.user && !initialView) {
        setActiveView('presenter');
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
      setActiveView('presenter');
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password';
      setError(msg);
      throw new Error(msg);
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
    await api.signOut().catch(() => {});
    setSession(null);
    setUser(null);
    setActiveView('login');
  };

  // ============================================
  // VIEW MANAGEMENT (auth-aware & history-pushed)
  // ============================================

  const setActiveView = (view: ActiveAppView, pushHistory = true) => {
    let targetView = view;
    if (['presenter', 'admin', 'analytics'].includes(view) && !session) {
      targetView = 'login';
    } else if (view === 'login' && session) {
      targetView = 'admin';
    }
    setActiveViewState(targetView);

    if (typeof window !== 'undefined' && pushHistory) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== targetView) {
        window.history.pushState({ view: targetView }, '', '#' + targetView);
      }
    }
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
          if (exists) {
            return prev.map(e => {
              if (e.id !== updated.id) return e;

              // Check if DB timer has elapsed based on questionStartedAt
              let dbTimerElapsed = false;
              if (updated.questionStartedAt && updated.isTimerRunning) {
                const totalSec = updated.questions[updated.currentQuestionIndex]?.timerSeconds || updated.timerRemainingSeconds || 45;
                const elapsedSec = Math.floor((Date.now() - updated.questionStartedAt) / 1000);
                if (totalSec - elapsedSec <= 0) {
                  dbTimerElapsed = true;
                }
              }

              // Preserve local timer state while it is actively ticking or if it has reached 0
              const isLocalExpired = (e.timerRemainingSeconds === 0 && !e.isTimerRunning) || dbTimerElapsed;
              const preserveLocalRunning = e.isTimerRunning && (e.timerRemainingSeconds ?? 1) > 0;

              return {
                ...updated,
                timerRemainingSeconds: isLocalExpired
                  ? 0
                  : preserveLocalRunning
                  ? e.timerRemainingSeconds
                  : updated.timerRemainingSeconds,
                isTimerRunning: isLocalExpired
                  ? false
                  : preserveLocalRunning
                  ? e.isTimerRunning
                  : updated.isTimerRunning,
                isVotingLocked: isLocalExpired ? true : updated.isVotingLocked,
              };
            });
          }
          return [updated, ...prev];
        });
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    }
  }, [currentEventId]);

  // Initial load & health check
  useEffect(() => {
    api.checkSupabaseStatus();
    refreshAllEvents();
  }, [refreshAllEvents]);

  // Current event derived
  const currentEvent = events.find(e => e.id === currentEventId) || events[0] || null;

  // ============================================
  // AUTO-KICK: Detect when participant is removed from event
  // ============================================
  // When the host resets/deletes the session, participant records get deleted from DB.
  // On next refresh/poll, the participant discovers they're no longer in the list and
  // gets kicked back to the join screen automatically.
  useEffect(() => {
    if (!currentParticipant || !currentEvent) return;
    
    // Grace period: allow 5 seconds after joining before running auto-kick to prevent race condition on initial join
    const isRecentlyJoined = Date.now() - (currentParticipant.joinedAt || 0) < 5000;
    if (isRecentlyJoined) return;

    // Check if our participant still exists in the event's participant list
    const stillExists = currentEvent.participants.some(p => p.id === currentParticipant.id);
    if (!stillExists && currentEvent.status !== 'live') {
      // We've been removed (session reset or participant deleted)
      // Clear local state so we return to the join screen
      setCurrentParticipant(null);
      localStorage.removeItem('pulselive_participant');
    }
  }, [currentEvent?.participants?.length, currentEvent?.status, currentParticipant]);

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
        },
        (payload) => {
          const updatedRow = payload.new as DbEvent;
          if (updatedRow.id !== currentEventId) return;
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
        },
        (payload) => {
          const row = payload.new as DbParticipant;
          if (row.event_id !== currentEventId) return;
          const newParticipant = dbParticipantToFrontend(row);
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
        },
        (payload) => {
          const row = payload.new as DbResponse;
          if (row.event_id !== currentEventId) return;
          const newResponse = dbResponseToFrontend(row);
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
        },
        (payload) => {
          const row = payload.new as DbParticipant;
          if (row.event_id !== currentEventId) return;
          const updated = dbParticipantToFrontend(row);
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
        },
        (payload) => {
          const row = payload.new as DbReaction;
          if (row.event_id !== currentEventId) return;
          const newReaction = dbReactionToFrontend(row);
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
        },
        (payload) => {
          if (payload.old && (payload.old as any).event_id && (payload.old as any).event_id !== currentEventId) return;
          refreshEvent();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          if (payload.old && (payload.old as any).event_id && (payload.old as any).event_id !== currentEventId) return;
          refreshEvent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEventId, refreshEvent]);

  // 3. Periodic lightweight heartbeat polling (Adaptive for high scale 400+ participants)
  // - Host views (Presenter / Projector / Admin): 3-second rapid sync for real-time live graphs
  // - Participant phones: 15-second gentle fallback (relies on instant WebSockets + tab focus refresh)
  useEffect(() => {
    if (!currentEventId) return;

    const isHostScreen = ['presenter', 'projector', 'admin', 'analytics'].includes(activeView);
    const pollInterval = isHostScreen ? 3000 : 15000;

    const interval = setInterval(() => {
      refreshEvent();
    }, pollInterval);

    // Instant refresh when participant unlocks phone or switches back to the browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshEvent();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEventId, activeView, refreshEvent]);

  // ============================================
  // SYNCHRONIZED COUNTDOWN TIMER TICKER
  // ============================================

  useEffect(() => {
    if (!currentEvent?.id || !currentEvent.isTimerRunning || !currentEvent.questionStartedAt) return;

    const eventId = currentEvent.id;
    const startedAt = currentEvent.questionStartedAt;
    const totalSeconds = currentEvent.questions[currentEvent.currentQuestionIndex]?.timerSeconds
      || currentEvent.timerRemainingSeconds
      || 45;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);

      setEvents(prev =>
        prev.map(evt => {
          if (evt.id !== eventId) return evt;
          if (remaining <= 0) {
            // Timer expired: lock voting, freeze at 0.
            return {
              ...evt,
              timerRemainingSeconds: 0,
              isTimerRunning: false,
              isVotingLocked: true,
            };
          }
          return {
            ...evt,
            timerRemainingSeconds: remaining,
          };
        })
      );
    };

    tick(); // immediate first tick
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [currentEvent?.id, currentEvent?.isTimerRunning, currentEvent?.questionStartedAt]);

  // ============================================
  // AUTO-ADVANCE ENGINE (Auto-Pilot)
  // ============================================
  const autoAdvanceIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceTargetQRef = React.useRef<number | null>(null);

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }
    setAutoAdvanceCountdown(null);
  }, []);

  // When question index or event changes, reset target so next question can auto-advance
  useEffect(() => {
    clearAutoAdvanceTimer();
    autoAdvanceTargetQRef.current = null;
  }, [currentEvent?.currentQuestionIndex, currentEvent?.id, clearAutoAdvanceTimer]);

  // When autoAdvance is turned off, cancel any active countdown
  useEffect(() => {
    if (!autoAdvance) {
      clearAutoAdvanceTimer();
      autoAdvanceTargetQRef.current = null;
    }
  }, [autoAdvance, clearAutoAdvanceTimer]);

  // When timer starts running with time > 0, cancel auto-advance
  useEffect(() => {
    if (currentEvent?.isTimerRunning && (currentEvent?.timerRemainingSeconds ?? 0) > 0) {
      clearAutoAdvanceTimer();
      autoAdvanceTargetQRef.current = null;
    }
  }, [currentEvent?.isTimerRunning, currentEvent?.timerRemainingSeconds, clearAutoAdvanceTimer]);

  // Main Auto-Advance trigger
  useEffect(() => {
    if (!currentEvent || !autoAdvance) return;
    if (currentEvent.status !== 'live') return;

    const qIdx = currentEvent.currentQuestionIndex ?? 0;
    const isTimerExpired = (currentEvent.timerRemainingSeconds ?? 1) <= 0 && !currentEvent.isTimerRunning;

    // Trigger auto-advance ONLY if:
    // 1. Timer has expired (0 seconds left & not running)
    // 2. We haven't already initiated countdown for this question index
    // 3. No active interval is currently running
    if (isTimerExpired && autoAdvanceTargetQRef.current !== qIdx && !autoAdvanceIntervalRef.current) {
      autoAdvanceTargetQRef.current = qIdx;
      setAutoAdvanceCountdown(autoAdvanceDelay);

      let remaining = autoAdvanceDelay;
      autoAdvanceIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearAutoAdvanceTimer();

          const totalQ = currentEvent.questions.length;
          if (qIdx >= totalQ - 1) {
            // Last question -> Finish session
            sendModeratorAction('end_session');
          } else {
            // Advance to next question and start timer
            sendModeratorAction('next_question').then(() => {
              setTimeout(() => {
                sendModeratorAction('start_timer');
              }, 600);
            });
          }
        } else {
          setAutoAdvanceCountdown(remaining);
        }
      }, 1000);
    }
  }, [
    currentEvent?.timerRemainingSeconds,
    currentEvent?.isTimerRunning,
    currentEvent?.status,
    currentEvent?.currentQuestionIndex,
    currentEvent?.questions?.length,
    autoAdvance,
    autoAdvanceDelay,
    clearAutoAdvanceTimer
  ]);

  // ============================================
  // USER ACTIONS
  // ============================================

  const setCurrentEventId = (id: string) => {
    setCurrentEventIdState(id);
  };

  const joinRoom = async (code: string, name: string, emoji?: string, bgColor?: string) => {
    setError(null);
    try {
      const res = await api.joinEventByCode(code, name, emoji, bgColor);
      
      // Update event state immediately so currentEvent has the new participant
      if (res.eventId) {
        setCurrentEventIdState(res.eventId);
        setEvents(prev =>
          prev.map(e => {
            if (e.id !== res.eventId) return e;
            const updatedParts = e.participants.some(p => p.id === res.participant.id)
              ? e.participants
              : [...e.participants, res.participant];
            return { ...e, participants: updatedParts };
          })
        );
      }

      setCurrentParticipant(res.participant);
      localStorage.setItem('pulselive_participant', JSON.stringify(res.participant));
      setActiveView('participant');

      // Broadcast to all devices locally in real-time
      broadcastLocalSync({
        type: 'PARTICIPANT_JOINED',
        eventId: res.eventId,
        roomCode: code.toUpperCase(),
        participant: res.participant,
      });

      if (res.eventId) {
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

    // Calculate exact updated fields to broadcast
    let updatedFields: any = {};
    switch (action) {
      case 'start_session':
        updatedFields = {
          status: 'live',
          isTimerRunning: true,
          isVotingLocked: false,
          timerRemainingSeconds: targetTimerSeconds ?? currentEvent.timerRemainingSeconds ?? getQTimer(qIdx),
        };
        break;
      case 'end_session':
        updatedFields = {
          status: 'ended',
          isTimerRunning: false,
        };
        break;
      case 'reset_session':
      case 'clear_room':
        updatedFields = {
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
        break;
      case 'next_question': {
        const nextIdx = Math.min(currentEvent.questions.length - 1, qIdx + 1);
        updatedFields = {
          currentQuestionIndex: nextIdx,
          timerRemainingSeconds: getQTimer(nextIdx),
          isTimerRunning: false,
          isVotingLocked: false,
          revealAnswer: false,
        };
        break;
      }
      case 'prev_question': {
        const prevIdx = Math.max(0, qIdx - 1);
        updatedFields = {
          currentQuestionIndex: prevIdx,
          timerRemainingSeconds: getQTimer(prevIdx),
          isTimerRunning: false,
          isVotingLocked: false,
          revealAnswer: false,
        };
        break;
      }
      case 'jump_to_question': {
        const jumpIdx = Math.max(0, Math.min(currentEvent.questions.length - 1, payload?.index ?? 0));
        updatedFields = {
          currentQuestionIndex: jumpIdx,
          timerRemainingSeconds: getQTimer(jumpIdx),
          isTimerRunning: false,
          isVotingLocked: false,
          revealAnswer: false,
        };
        break;
      }
      case 'reset_timer':
        updatedFields = {
          timerRemainingSeconds: getQTimer(qIdx),
          isTimerRunning: false,
          isVotingLocked: false,
        };
        break;
      case 'toggle_timer':
        updatedFields = {
          isTimerRunning: !currentEvent.isTimerRunning,
        };
        break;
      case 'start_timer':
        updatedFields = {
          isTimerRunning: true,
        };
        break;
      case 'stop_timer':
      case 'pause_timer':
        updatedFields = {
          isTimerRunning: false,
        };
        break;
      case 'add_time':
        updatedFields = {
          timerRemainingSeconds: (currentEvent.timerRemainingSeconds ?? getQTimer(qIdx)) + (payload?.seconds || 15),
        };
        break;
      case 'lock_voting':
      case 'toggle_lock_voting':
        updatedFields = {
          isVotingLocked: !currentEvent.isVotingLocked,
        };
        break;
      case 'reveal_answer':
      case 'toggle_reveal_answer':
        updatedFields = {
          revealAnswer: !currentEvent.revealAnswer,
        };
        break;
      case 'toggle_results':
        updatedFields = {
          showResultsOnProjector: payload?.show ?? !currentEvent.showResultsOnProjector,
        };
        break;
      default:
        updatedFields = payload?.updatedFields || {};
        break;
    }

    // Broadcast updated state to all connected devices locally
    broadcastLocalSync({
      type: 'MODERATOR_ACTION_BROADCAST',
      eventId: currentEvent.id,
      action,
      updatedFields,
    });

    try {
      await api.sendControlAction(currentEvent.id, action, enrichedPayload);
    } catch (err: any) {
      setError(err.message || 'Moderator action failed');
    }
  };

  const lastReactionDbTimeRef = React.useRef<number>(0);

  const sendReaction = (emoji: string) => {
    if (!currentEvent) return;
    const name = currentParticipant?.name || 'Attendee';
    
    // 1. Instant local animation & local broadcast (unlimited 0ms taps for audience delight)
    broadcastLocalSync({
      type: 'REACTION_SENT',
      eventId: currentEvent.id,
      emoji,
      name,
    });

    // 2. Throttle database writes to at most 1 per 800ms per participant
    // Prevents exhausting Supabase Free tier DB quota if 400 people spam emojis
    const now = Date.now();
    if (now - lastReactionDbTimeRef.current > 800) {
      lastReactionDbTimeRef.current = now;
      api.sendReactionDirect(currentEvent.id, emoji, name).catch(() => {});
    }
  };

  const deleteEvent = async (id: string) => {
    const remaining = events.filter(e => e.id !== id);
    setEvents(remaining);
    setCurrentEventIdState(prev => {
      const stillThere = remaining.some(e => e.id === prev);
      return stillThere ? prev : (remaining.length > 0 ? remaining[0].id : '');
    });
    broadcastLocalSync({ type: 'ALL_EVENTS_UPDATED', events: remaining });
    await api.deleteEventById(id);
  };

  const deleteParticipant = async (participantId: string) => {
    if (!currentEvent) return;
    const remainingParticipants = currentEvent.participants.filter(p => p.id !== participantId);
    const remainingResponses = currentEvent.responses.filter(r => r.participantId !== participantId);

    setEvents(prev =>
      prev.map(e => {
        if (e.id !== currentEvent.id) return e;
        return {
          ...e,
          participants: remainingParticipants,
          responses: remainingResponses,
        };
      })
    );

    broadcastLocalSync({
      type: 'MODERATOR_ACTION_BROADCAST',
      eventId: currentEvent.id,
      action: 'delete_participant',
      updatedFields: {
        participants: remainingParticipants,
        responses: remainingResponses,
      },
    });

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

    broadcastLocalSync({
      type: 'MODERATOR_ACTION_BROADCAST',
      eventId: currentEvent.id,
      action: 'clear_participants',
      updatedFields: {
        participants: [],
        responses: [],
        reactions: [],
      },
    });

    await api.clearAllParticipantsAndResponses(currentEvent.id);
  };

  const simulateAudienceVotes = async (count: number = 10) => {
    if (!currentEvent) return;
    setIsSimulatingCrowd(true);
    try {
      const qIdx = currentEvent.currentQuestionIndex ?? 0;
      const currentQ = currentEvent.questions[qIdx];
      if (!currentQ) return;

      const sampleNames = ['Aria', 'Kenzo', 'Maya', 'Devon', 'Chloe', 'Zack', 'Elena', 'Lucas', 'Priya', 'Tariq', 'Sara', 'Leo', 'Budi', 'Rian', 'Dewi', 'Siti', 'Fajar', 'Nadia', 'Dimas', 'Putri', 'Agus', 'Anisa', 'Bayu', 'Citra'];
      const emojis = ['🦊', '🐼', '🦁', '🦉', '🐱', '🐶', '🚀', '💡', '🔥', '✨', '🧠', '🎉'];
      const sampleWords = ['Innovation', 'Leadership', 'Efficiency', 'Collaboration', 'Scalability', 'Impact', 'Focus', 'Trust', 'Kecepatan', 'Kreativitas', 'Adaptasi', 'Teknologi'];
      const bgColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'];

      const newSimParts: Participant[] = [];
      const newSimResps: ResponseItem[] = [];

      for (let i = 0; i < count; i++) {
        const pId = 'p-sim-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6);
        const nameBase = sampleNames[(Date.now() + i) % sampleNames.length];
        const pName = `${nameBase} ${Math.floor(Math.random() * 899 + 100)}`;
        const avatarEmoji = emojis[i % emojis.length];
        const avatarBg = bgColors[i % bgColors.length];

        const partObj: Participant = {
          id: pId,
          event_id: currentEvent.id,
          name: pName,
          avatarBg,
          avatarEmoji,
          joinedAt: Date.now(),
          score: 100,
        };
        newSimParts.push(partObj);

        let selectedOptionIds: string[] = [];
        let textResponse: string | undefined;
        let ratingValue: number | undefined;

        if (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') {
          const qOpts = currentQ.options || [];
          if (qOpts.length > 0) {
            const randOpt = qOpts[Math.floor(Math.random() * qOpts.length)];
            selectedOptionIds = [randOpt.id];
          }
        } else if (currentQ.type === 'rating') {
          ratingValue = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
        } else if (currentQ.type === 'word_cloud') {
          textResponse = sampleWords[Math.floor(Math.random() * sampleWords.length)];
        } else {
          textResponse = `Feedback poin #${i + 1} dari partisipan live.`;
        }

        const respObj: ResponseItem = {
          id: 'resp-sim-' + Date.now() + '-' + i,
          event_id: currentEvent.id,
          participantId: pId,
          participantName: pName,
          questionId: currentQ.id,
          selectedOptionIds,
          textResponse,
          ratingValue,
          timeTakenSeconds: Math.floor(Math.random() * 8) + 2,
          submittedAt: Date.now(),
        };
        newSimResps.push(respObj);
      }

      setEvents(prev =>
        prev.map(evt => {
          if (evt.id !== currentEvent.id) return evt;
          return {
            ...evt,
            participants: [...evt.participants, ...newSimParts],
            responses: [...evt.responses, ...newSimResps],
          };
        })
      );

      // Broadcast to all connected devices locally
      broadcastLocalSync({
        type: 'MODERATOR_ACTION_BROADCAST',
        eventId: currentEvent.id,
        action: 'simulate_crowd',
        updatedFields: {
          participants: [...currentEvent.participants, ...newSimParts],
          responses: [...currentEvent.responses, ...newSimResps],
        },
      });

      await sendModeratorAction('simulate_crowd', { count });
    } finally {
      setTimeout(() => setIsSimulatingCrowd(false), 500);
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
        isHost: Boolean(session),
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
        autoAdvance,
        setAutoAdvance,
        autoAdvanceDelay,
        setAutoAdvanceDelay,
        autoAdvanceCountdown,
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
