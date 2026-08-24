import { supabase } from '../lib/supabase';
import {
  EventData,
  Question,
  Participant,
  ResponseItem,
  LiveReaction,
  DbEvent,
  DbQuestion,
  DbParticipant,
  DbResponse,
  DbReaction,
  dbEventToFrontend,
  dbQuestionToFrontend,
  dbParticipantToFrontend,
  dbResponseToFrontend,
  dbReactionToFrontend,
} from '../types';
import { Groq } from 'groq-sdk';

import { INITIAL_EVENTS } from '../data/initialEvents';
import { validateParticipantName } from './profanityFilter';

// Persistent local events store with localStorage backup so deletions/edits survive F5 refresh
const STORAGE_KEY = 'pulselive_saved_events';

function getInitialLocalEvents(): EventData[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not read from localStorage:', e);
  }
  return [...INITIAL_EVENTS];
}

let localEventsStore: EventData[] = getInitialLocalEvents();

export function saveLocalEventsStore(events: EventData[]) {
  localEventsStore = events;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn('Could not write to localStorage:', e);
  }
}

// ============================================
// 0. SUPABASE HEALTH & DIAGNOSTIC CHECK
// ============================================

export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  error?: string;
  tables?: { events: boolean; questions: boolean; participants: boolean; responses: boolean };
}> {
  try {
    const { data: eData, error: eErr } = await supabase.from('events').select('id').limit(1);
    if (eErr) {
      console.warn('❌ [Supabase Diagnostic] Events table check failed:', eErr.message);
      return { connected: false, error: eErr.message };
    }

    const [qTest, pTest, rTest] = await Promise.all([
      supabase.from('questions').select('id').limit(1),
      supabase.from('participants').select('id').limit(1),
      supabase.from('responses').select('id').limit(1),
    ]);

    const status = {
      connected: true,
      tables: {
        events: !eErr,
        questions: !qTest.error,
        participants: !pTest.error,
        responses: !rTest.error,
      },
    };
    console.log('✅ [Supabase Diagnostic] Cloud Database Connected:', status);
    return status;
  } catch (err: any) {
    console.warn('❌ [Supabase Diagnostic] Connection failed:', err.message);
    return { connected: false, error: err.message || 'Network unreachable' };
  }
}

// ============================================
// 1. SUPABASE QUERIES (Fetch operations)
// ============================================

export async function fetchFullEvent(eventId: string): Promise<EventData | null> {
  try {
    const { data: eventRow, error: evtErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (evtErr || !eventRow) {
      return localEventsStore.find(e => e.id === eventId) || null;
    }

    const [questionsRes, participantsRes, responsesRes, reactionsRes] = await Promise.all([
      supabase.from('questions').select('*').eq('event_id', eventId).order('sort_order'),
      supabase.from('participants').select('*').eq('event_id', eventId).order('joined_at'),
      supabase.from('responses').select('*').eq('event_id', eventId).order('submitted_at'),
      supabase.from('reactions').select('*').eq('event_id', eventId).order('created_at', { ascending: false }).limit(25),
    ]);

    const questions = (questionsRes.data || []).map((q: DbQuestion) => dbQuestionToFrontend(q));
    const participants = (participantsRes.data || []).map((p: DbParticipant) => dbParticipantToFrontend(p));
    const responses = (responsesRes.data || []).map((r: DbResponse) => dbResponseToFrontend(r));
    const reactions = (reactionsRes.data || []).map((r: DbReaction) => dbReactionToFrontend(r));

    const fullEvt = dbEventToFrontend(eventRow as DbEvent, questions, participants, responses, reactions);
    localEventsStore = [fullEvt, ...localEventsStore.filter(e => e.id !== eventId)];
    return fullEvt;
  } catch {
    return localEventsStore.find(e => e.id === eventId) || null;
  }
}

export async function fetchAllEvents(): Promise<EventData[]> {
  try {
    const { data: eventRows, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !eventRows || eventRows.length === 0) {
      return localEventsStore;
    }

    const results: EventData[] = [];
    for (const row of eventRows) {
      const [questionsRes, participantsRes, responsesRes] = await Promise.all([
        supabase.from('questions').select('*').eq('event_id', row.id).order('sort_order'),
        supabase.from('participants').select('*').eq('event_id', row.id),
        supabase.from('responses').select('*').eq('event_id', row.id),
      ]);

      const questions = (questionsRes.data || []).map((q: DbQuestion) => dbQuestionToFrontend(q));
      const participants = (participantsRes.data || []).map((p: DbParticipant) => dbParticipantToFrontend(p));
      const responses = (responsesRes.data || []).map((r: DbResponse) => dbResponseToFrontend(r));

      results.push(dbEventToFrontend(row as DbEvent, questions, participants, responses, []));
    }
    localEventsStore = results;
    return results;
  } catch {
    return localEventsStore;
  }
}

export async function fetchEventByRoomCode(code: string): Promise<EventData | null> {
  const normalized = code.trim().toUpperCase();
  try {
    const { data: row, error } = await supabase
      .from('events')
      .select('*')
      .ilike('room_code', normalized)
      .single();

    if (error || !row) {
      return localEventsStore.find(e => e.roomCode.toUpperCase() === normalized) || null;
    }
    return fetchFullEvent(row.id);
  } catch {
    return localEventsStore.find(e => e.roomCode.toUpperCase() === normalized) || null;
  }
}

// ============================================
// 2. AUTH HELPERS
// ============================================

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ============================================
// 3. EVENT CREATION & MODIFICATION (Direct Supabase)
// ============================================

export async function createNewEvent(eventData: {
  title: string;
  roomCode?: string;
  description?: string;
  category?: string;
  organizerName?: string;
  isQuizMode?: boolean;
  questions?: Partial<Question>[];
}) {
  const session = await getSession();
  const roomCode = eventData.roomCode?.trim()?.toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();
  const newId = 'evt-' + Date.now();

  const formattedQuestions: Question[] = (eventData.questions || []).map((q, i) => ({
    id: q.id || `q-${newId}-${i + 1}`,
    type: q.type || 'multiple_choice',
    title: q.title || 'Question Title',
    subtitle: q.subtitle || '',
    timerSeconds: q.timerSeconds || 45,
    points: eventData.isQuizMode 
      ? (q.points || (q.type === 'multiple_choice' || q.type === 'true_false' ? 100 : undefined))
      : undefined,
    options: q.options || [],
    ratingMin: q.ratingMin || (q.type === 'rating' ? 1 : undefined),
    ratingMax: q.ratingMax || (q.type === 'rating' ? 5 : undefined),
    ratingMinLabel: q.ratingMinLabel || (q.type === 'rating' ? 'Low' : undefined),
    ratingMaxLabel: q.ratingMaxLabel || (q.type === 'rating' ? 'High' : undefined),
    maxWordCount: q.maxWordCount || (q.type === 'word_cloud' ? 2 : undefined),
    allowMultiple: q.allowMultiple || false,
  }));

  const initialDuration = formattedQuestions[0]?.timerSeconds || 45;

  const localNewEvent: EventData = {
    id: newId,
    roomCode,
    title: eventData.title,
    description: eventData.description || '',
    category: eventData.category || 'General Session',
    organizerName: eventData.organizerName || 'Moderator',
    createdAt: Date.now(),
    status: 'waiting',
    currentQuestionIndex: 0,
    questionStartedAt: 0,
    timerRemainingSeconds: initialDuration,
    isTimerRunning: false,
    showResultsOnProjector: true,
    isVotingLocked: false,
    revealAnswer: false,
    isQuizMode: eventData.isQuizMode || false,
    questions: formattedQuestions,
    participants: [],
    responses: [],
    reactions: [],
  };

  // Add to local store first and persist
  localEventsStore = [localNewEvent, ...localEventsStore];
  saveLocalEventsStore(localEventsStore);

  try {
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .insert({
        room_code: roomCode,
        title: eventData.title,
        description: eventData.description || '',
        category: eventData.category || 'General Session',
        organizer_name: eventData.organizerName || 'Moderator',
        organizer_id: session?.user?.id || null,
        status: 'waiting',
        timer_remaining_seconds: initialDuration,
        is_timer_running: false,
        show_results_on_projector: true,
        is_voting_locked: false,
        reveal_answer: false,
      })
      .select()
      .single();

    if (!evtErr && event) {
      localNewEvent.id = event.id;
      if (eventData.questions && eventData.questions.length > 0) {
        const qInserts = eventData.questions.map((q, i) => ({
          event_id: event.id,
          type: q.type || 'multiple_choice',
          title: q.title || 'Question Title',
          subtitle: q.subtitle || '',
          sort_order: i,
          timer_seconds: q.timerSeconds || 45,
          options: q.options || [],
          rating_min: q.ratingMin || 1,
          rating_max: q.ratingMax || 5,
          rating_min_label: q.ratingMinLabel || 'Low',
          rating_max_label: q.ratingMaxLabel || 'High',
          max_word_count: q.maxWordCount || 2,
          allow_multiple: q.allowMultiple || false,
        }));
        await supabase.from('questions').insert(qInserts);
      }
      return localNewEvent;
    }
  } catch (err) {
    console.warn('Supabase create event fallback to local store:', err);
  }

  return localNewEvent;
}

export async function updateExistingEvent(id: string, eventData: Partial<EventData>) {
  const localEvt = localEventsStore.find(e => e.id === id);
  if (localEvt) {
    Object.assign(localEvt, eventData);
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();
    if (error) console.warn('Supabase updateExistingEvent warning:', error.message);
    return data || localEvt;
  } catch {
    return localEvt;
  }
}

export async function deleteEventById(id: string) {
  // 1. Immediately delete from local store and persist to localStorage
  localEventsStore = localEventsStore.filter(e => e.id !== id);
  saveLocalEventsStore(localEventsStore);

  // 2. Cascade delete from Supabase
  try {
    await Promise.allSettled([
      supabase.from('responses').delete().eq('event_id', id),
      supabase.from('participants').delete().eq('event_id', id),
      supabase.from('reactions').delete().eq('event_id', id),
      supabase.from('questions').delete().eq('event_id', id),
    ]);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) console.warn('Supabase delete event notice:', error.message);
  } catch (err) {
    console.warn('Supabase delete event fallback:', err);
  }
}

export async function deleteParticipantById(eventId: string, participantId: string) {
  // 1. Remove from local store and persist
  const localEvt = localEventsStore.find(e => e.id === eventId);
  if (localEvt) {
    localEvt.participants = (localEvt.participants || []).filter(p => p.id !== participantId);
    localEvt.responses = (localEvt.responses || []).filter(r => r.participantId !== participantId);
    saveLocalEventsStore(localEventsStore);
  }

  // 2. Remove from Supabase if valid UUID
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(participantId);
    if (isUuid) {
      await Promise.allSettled([
        supabase.from('responses').delete().eq('participant_id', participantId),
        supabase.from('participants').delete().eq('id', participantId),
      ]);
    }
  } catch (err) {
    console.warn('Supabase delete participant warning:', err);
  }
}

export async function clearAllParticipantsAndResponses(eventId: string) {
  // 1. Clear in local store and persist
  const localEvt = localEventsStore.find(e => e.id === eventId);
  if (localEvt) {
    localEvt.participants = [];
    localEvt.responses = [];
    localEvt.reactions = [];
    saveLocalEventsStore(localEventsStore);
  }

  // 2. Clear in Supabase
  try {
    await Promise.allSettled([
      supabase.from('responses').delete().eq('event_id', eventId),
      supabase.from('participants').delete().eq('event_id', eventId),
      supabase.from('reactions').delete().eq('event_id', eventId),
    ]);
  } catch (err) {
    console.warn('Supabase clear participants warning:', err);
  }
}

// ============================================
// ============================================
// 4. PARTICIPANT ACTIONS (Direct Supabase)
// ============================================

export async function joinEventByCode(code: string, name: string, emoji?: string, bgColor?: string) {
  const normalizedCode = code.trim().toUpperCase();
  const avatarBgs = ['#4F46E5', '#0D9488', '#D97706', '#9333EA', '#E11D48', '#0284C7', '#EA580C', '#DB2777'];
  const finalBg = bgColor || avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

  // 1. Validate Name Length & Profanity Filter
  const validation = validateParticipantName(name);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Nama tidak valid.');
  }
  const cleanName = validation.sanitizedName || (emoji ? `${emoji} Attendee` : 'Attendee');

  try {
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .select('id, room_code, title')
      .ilike('room_code', normalizedCode)
      .single();

    if (evtErr || !event) {
      // Check local store
      const localEvt = localEventsStore.find(e => e.roomCode.toUpperCase() === normalizedCode);
      if (!localEvt) {
        throw new Error('Kode room tidak ditemukan. Silakan periksa kembali PIN room.');
      }

      // Check duplicate name in local store
      if (localEvt.participants.some(p => p.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        throw new Error(`Nama "${cleanName}" sudah dipakai di room ini. Gunakan nama lengkap atau tambahkan inisial/angka.`);
      }

      const newPart: Participant = {
        id: 'p-' + Date.now(),
        event_id: localEvt.id,
        name: cleanName,
        avatarBg: finalBg,
        avatarEmoji: emoji || '🦊',
        joinedAt: Date.now(),
        score: 0,
      };
      localEvt.participants = [...localEvt.participants, newPart];
      saveLocalEventsStore(localEventsStore);
      return {
        eventId: localEvt.id,
        participant: newPart,
      };
    }

    // 2. Check duplicate name in Supabase for this specific event
    const { data: existingParts } = await supabase
      .from('participants')
      .select('name')
      .eq('event_id', event.id);

    if (existingParts && existingParts.some(p => (p.name || '').trim().toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Nama "${cleanName}" sudah digunakan di room ini. Gunakan nama lengkap atau tambahkan angka/inisial.`);
    }

    const { data: participant, error: partErr } = await supabase
      .from('participants')
      .insert({
        event_id: event.id,
        name: cleanName,
        avatar_bg: finalBg,
        avatar_emoji: emoji || '🦊',
        score: 0,
      })
      .select()
      .single();

    if (partErr) {
      console.warn('⚠️ [Supabase] Participant insert error:', partErr.message);
      // Fallback participant object
      const fallbackPart: Participant = {
        id: 'p-' + Date.now(),
        event_id: event.id,
        name: cleanName,
        avatarBg: finalBg,
        avatarEmoji: emoji || '🦊',
        joinedAt: Date.now(),
        score: 0,
      };
      const localEvt = localEventsStore.find(e => e.id === event.id || e.roomCode.toUpperCase() === normalizedCode);
      if (localEvt) {
        localEvt.participants = [...localEvt.participants.filter(p => p.id !== fallbackPart.id), fallbackPart];
        saveLocalEventsStore(localEventsStore);
      }
      return {
        eventId: event.id,
        participant: fallbackPart,
      };
    }

    const frontendPart = dbParticipantToFrontend(participant as DbParticipant);
    const localEvt = localEventsStore.find(e => e.id === event.id || e.roomCode.toUpperCase() === normalizedCode);
    if (localEvt) {
      localEvt.participants = [...localEvt.participants.filter(p => p.id !== frontendPart.id), frontendPart];
      saveLocalEventsStore(localEventsStore);
    }

    return {
      eventId: event.id,
      participant: frontendPart,
    };
  } catch (err: any) {
    console.error('❌ [Join] Error in joinEventByCode:', err.message);
    if (err.message && (err.message.includes('sudah dipakai') || err.message.includes('sudah digunakan') || err.message.includes('tidak pantas') || err.message.includes('maksimal'))) {
      throw err;
    }
    const localEvt = localEventsStore.find(e => e.roomCode.toUpperCase() === normalizedCode);
    if (localEvt) {
      if (localEvt.participants.some(p => p.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        throw new Error(`Nama "${cleanName}" sudah dipakai di room ini. Gunakan nama lengkap atau tambahkan inisial/angka.`);
      }
      const newPart: Participant = {
        id: 'p-' + Date.now(),
        event_id: localEvt.id,
        name: cleanName,
        avatarBg: finalBg,
        avatarEmoji: emoji || '🦊',
        joinedAt: Date.now(),
        score: 0,
      };
      localEvt.participants = [...localEvt.participants, newPart];
      return {
        eventId: localEvt.id,
        participant: newPart,
      };
    }
    throw new Error(err.message || 'Room code not found.');
  }
}

export async function submitQuestionResponse(
  eventId: string,
  payload: {
    participantId: string;
    participantName: string;
    questionId: string;
    selectedOptionIds?: string[];
    textResponse?: string;
    ratingValue?: number;
    timeTakenSeconds?: number;
  }
) {
  // Always update local store
  const localEvt = localEventsStore.find(e => e.id === eventId);
  if (localEvt) {
    const newResp: ResponseItem = {
      id: 'resp-' + Date.now(),
      event_id: eventId,
      participantId: payload.participantId,
      participantName: payload.participantName,
      questionId: payload.questionId,
      selectedOptionIds: payload.selectedOptionIds || [],
      textResponse: payload.textResponse,
      ratingValue: payload.ratingValue,
      timeTakenSeconds: payload.timeTakenSeconds || 0,
      submittedAt: Date.now(),
    };
    localEvt.responses = [
      ...localEvt.responses.filter(r => !(r.participantId === payload.participantId && r.questionId === payload.questionId)),
      newResp
    ];
  }

  try {
    await supabase
      .from('responses')
      .upsert({
        event_id: eventId,
        participant_id: payload.participantId,
        participant_name: payload.participantName,
        question_id: payload.questionId,
        selected_option_ids: payload.selectedOptionIds || [],
        text_response: payload.textResponse || null,
        rating_value: payload.ratingValue || null,
        time_taken_seconds: payload.timeTakenSeconds || 0,
      }, { onConflict: 'participant_id,question_id' });
  } catch (err) {
    console.warn('Supabase response submit fallback:', err);
  }

  return { success: true };
}

// ============================================
// 5. MODERATOR CONTROLS (Direct Supabase)
// ============================================

export async function sendControlAction(eventId: string, action: string, payload?: any) {
  const localEvt = localEventsStore.find(e => e.id === eventId);
  
  // Use enriched timerSeconds from payload (sent by EventContext) as primary source,
  // fall back to localEventsStore questions, then default 45
  const getQuestionTimer = (index: number) => {
    if (payload?.timerSeconds) return payload.timerSeconds;
    if (localEvt?.questions?.[index]?.timerSeconds) return localEvt.questions[index].timerSeconds;
    return 45;
  };

  if (localEvt) {
    const qIdx = localEvt.currentQuestionIndex ?? 0;

    switch (action) {
      case 'start_session':
        localEvt.status = 'live';
        localEvt.isTimerRunning = true;
        localEvt.isVotingLocked = false;
        localEvt.timerRemainingSeconds = localEvt.timerRemainingSeconds ?? getQuestionTimer(qIdx);
        break;
      case 'end_session':
        localEvt.status = 'ended';
        localEvt.isTimerRunning = false;
        break;
      case 'reset_session':
      case 'clear_room':
        localEvt.status = 'waiting';
        localEvt.currentQuestionIndex = 0;
        localEvt.isTimerRunning = false;
        localEvt.isVotingLocked = false;
        localEvt.showResultsOnProjector = true;
        localEvt.revealAnswer = false;
        localEvt.timerRemainingSeconds = getQuestionTimer(0);
        localEvt.participants = [];
        localEvt.responses = [];
        localEvt.reactions = [];
        break;
      case 'next_question': {
        const nextIdx = Math.min(localEvt.questions.length - 1, qIdx + 1);
        localEvt.currentQuestionIndex = nextIdx;
        localEvt.timerRemainingSeconds = getQuestionTimer(nextIdx);
        localEvt.isTimerRunning = false; // Stopped so presenter can introduce question
        localEvt.isVotingLocked = false;
        localEvt.revealAnswer = false;
        break;
      }
      case 'prev_question': {
        const prevIdx = Math.max(0, qIdx - 1);
        localEvt.currentQuestionIndex = prevIdx;
        localEvt.timerRemainingSeconds = getQuestionTimer(prevIdx);
        localEvt.isTimerRunning = false;
        localEvt.isVotingLocked = false;
        localEvt.revealAnswer = false;
        break;
      }
      case 'toggle_timer':
        localEvt.isTimerRunning = !localEvt.isTimerRunning;
        break;
      case 'start_timer':
        localEvt.isTimerRunning = true;
        break;
      case 'stop_timer':
      case 'pause_timer':
        localEvt.isTimerRunning = false;
        break;
      case 'add_time':
        localEvt.timerRemainingSeconds = (localEvt.timerRemainingSeconds || getQuestionTimer(qIdx)) + (payload?.seconds || 15);
        break;
      case 'lock_voting':
      case 'toggle_lock_voting':
        localEvt.isVotingLocked = !localEvt.isVotingLocked;
        break;
      case 'reveal_answer':
      case 'toggle_reveal_answer':
        localEvt.revealAnswer = !localEvt.revealAnswer;
        break;
      case 'toggle_results':
        localEvt.showResultsOnProjector = payload?.show ?? !localEvt.showResultsOnProjector;
        break;
      case 'jump_to_question': {
        const jumpIdx = Math.max(0, Math.min(localEvt.questions.length - 1, payload?.index ?? 0));
        localEvt.currentQuestionIndex = jumpIdx;
        localEvt.timerRemainingSeconds = getQuestionTimer(jumpIdx);
        localEvt.isTimerRunning = false;
        localEvt.isVotingLocked = false;
        localEvt.revealAnswer = false;
        break;
      }
      case 'reset_timer':
        localEvt.timerRemainingSeconds = getQuestionTimer(qIdx);
        localEvt.isTimerRunning = false; // STOPPED until presenter hits Start Timer
        localEvt.isVotingLocked = false;
        break;
    }
  }

  try {
    const [{ data: event }, { data: dbQuestions }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('questions').select('*').eq('event_id', eventId).order('sort_order'),
    ]);

    if (!event) return;

    // Build a reliable timer lookup from actual DB questions
    const qTimerFromDb = (idx: number) => {
      if (payload?.timerSeconds) return payload.timerSeconds;
      const q = dbQuestions?.[idx];
      if (q?.timer_seconds) return q.timer_seconds;
      if (localEvt?.questions?.[idx]?.timerSeconds) return localEvt.questions[idx].timerSeconds;
      return 45;
    };

    let updates: any = {};
    const qIdx = event.current_question_index ?? 0;
    const currentQTimer = qTimerFromDb(qIdx);

    switch (action) {
      case 'start_session':
        updates = {
          status: 'live',
          is_timer_running: true,
          question_started_at: new Date().toISOString(),
          timer_remaining_seconds: event.timer_remaining_seconds || qTimerFromDb(0),
          is_voting_locked: false,
        };
        break;
      case 'end_session':
        updates = { status: 'ended', is_timer_running: false };
        break;
      case 'reset_session':
      case 'clear_room':
        updates = {
          status: 'waiting',
          current_question_index: 0,
          is_timer_running: false,
          is_voting_locked: false,
          show_results_on_projector: true,
          reveal_answer: false,
          timer_remaining_seconds: qTimerFromDb(0),
        };
        await Promise.all([
          supabase.from('responses').delete().eq('event_id', eventId),
          supabase.from('participants').delete().eq('event_id', eventId),
          supabase.from('reactions').delete().eq('event_id', eventId),
        ]);
        break;
      case 'next_question': {
        const nextIdx = qIdx + 1;
        updates = {
          current_question_index: nextIdx,
          is_timer_running: true, // AUTO-START TIMER LIKE KAHOOT
          question_started_at: new Date().toISOString(),
          timer_remaining_seconds: qTimerFromDb(nextIdx),
          is_voting_locked: false,
          show_results_on_projector: true,
          reveal_answer: false,
        };
        break;
      }
      case 'prev_question': {
        const prevIdx = Math.max(0, qIdx - 1);
        updates = {
          current_question_index: prevIdx,
          is_timer_running: true, // AUTO-START TIMER LIKE KAHOOT
          question_started_at: new Date().toISOString(),
          timer_remaining_seconds: qTimerFromDb(prevIdx),
          is_voting_locked: false,
          show_results_on_projector: true,
          reveal_answer: false,
        };
        break;
      }
      case 'jump_to_question': {
        const jumpIdx = payload?.index ?? 0;
        updates = {
          current_question_index: jumpIdx,
          is_timer_running: true, // AUTO-START TIMER LIKE KAHOOT
          question_started_at: new Date().toISOString(),
          timer_remaining_seconds: qTimerFromDb(jumpIdx),
          is_voting_locked: false,
          show_results_on_projector: true,
          reveal_answer: false,
        };
        break;
      }
      case 'toggle_timer':
        updates = {
          is_timer_running: !event.is_timer_running,
          question_started_at: !event.is_timer_running ? new Date().toISOString() : event.question_started_at,
        };
        break;
      case 'start_timer':
        updates = {
          is_timer_running: true,
          question_started_at: new Date().toISOString(),
        };
        break;
      case 'stop_timer':
      case 'pause_timer':
        updates = { is_timer_running: false };
        break;
      case 'add_time':
        updates = { timer_remaining_seconds: (event.timer_remaining_seconds || currentQTimer) + (payload?.seconds || 15) };
        break;
      case 'lock_voting':
      case 'toggle_lock_voting':
        updates = { is_voting_locked: !event.is_voting_locked, is_timer_running: event.is_voting_locked };
        break;
      case 'unlock_voting':
        updates = { is_voting_locked: false, is_timer_running: false };
        break;
      case 'toggle_results':
        updates = { show_results_on_projector: payload?.show ?? !event.show_results_on_projector };
        break;
      case 'reveal_answer':
      case 'toggle_reveal_answer':
        updates = { reveal_answer: !event.reveal_answer, show_results_on_projector: true };
        break;
      case 'reset_timer':
        updates = {
          timer_remaining_seconds: currentQTimer,
          question_started_at: new Date().toISOString(),
          is_timer_running: false, // STOPPED
          is_voting_locked: false,
        };
        break;
      case 'simulate_crowd':
        return handleSimulateCrowdDirect(eventId, payload?.count || 10);
      default:
        break;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('events').update(updates).eq('id', eventId);
      if (error) console.warn('Supabase update control warning:', error.message);
    }
  } catch (err) {
    console.warn('sendControlAction error:', err);
  }
}

// Direct crowd simulation
async function handleSimulateCrowdDirect(eventId: string, count: number) {
  const { data: event } = await supabase.from('events').select('current_question_index').eq('id', eventId).single();
  const { data: questions } = await supabase.from('questions').select('*').eq('event_id', eventId).order('sort_order');
  if (!event || !questions || questions.length === 0) return;

  const currentQ = questions[event.current_question_index];
  if (!currentQ) return;

  const simParticipants = [];
  const simResponses = [];

  const sampleNames = ['Aria', 'Kenzo', 'Maya', 'Devon', 'Chloe', 'Zack', 'Elena', 'Lucas', 'Priya', 'Tariq', 'Sara', 'Leo'];
  const emojis = ['🚀', '💡', '🔥', '✨', '🧠', '🎉', '🎯', '⚡'];
  const sampleWords = ['Innovation', 'Leadership', 'Efficiency', 'Collaboration', 'Scalability', 'Impact', 'Focus', 'Trust'];

  for (let i = 0; i < count; i++) {
    const pId = crypto.randomUUID();
    const nameIndex = (Date.now() + i) % sampleNames.length;
    const pName = `${sampleNames[nameIndex]} ${Math.floor(Math.random() * 90 + 10)}`;
    const avatarEmoji = emojis[i % emojis.length];
    
    simParticipants.push({
      id: pId,
      event_id: eventId,
      name: pName,
      avatar_bg: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'][i % 6],
      avatar_emoji: avatarEmoji,
      score: 100,
    });

    let opts: any = {};
    if (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') {
      const qOpts = currentQ.options || [];
      if (qOpts.length > 0) {
        const randOpt = qOpts[Math.floor(Math.random() * qOpts.length)];
        opts.selected_option_ids = [randOpt.id];
      }
    } else if (currentQ.type === 'rating') {
      opts.rating_value = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
    } else if (currentQ.type === 'word_cloud') {
      opts.text_response = sampleWords[Math.floor(Math.random() * sampleWords.length)];
    } else {
      opts.text_response = `High-priority discussion topic #${i + 1} from audience member.`;
    }

    simResponses.push({
      event_id: eventId,
      participant_id: pId,
      participant_name: pName,
      question_id: currentQ.id,
      ...opts,
    });
  }

  await supabase.from('participants').insert(simParticipants);
  await supabase.from('responses').insert(simResponses);
}

// ============================================
// 6. REACTIONS (Direct Supabase)
// ============================================

export async function sendReactionDirect(eventId: string, emoji: string, senderName: string) {
  const { error } = await supabase.from('reactions').insert({
    event_id: eventId,
    emoji,
    sender_name: senderName,
  });
  if (error) console.warn('Reaction insert error:', error);
}

// ============================================
// 7. GROQ AI (Client & Fallback)
// ============================================

export async function generateAIQuestions(topic: string, audienceType: string, count: number = 4): Promise<Question[]> {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY as string) || '';

  if (apiKey) {
    try {
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      const prompt = `
        You are an expert interactive presentation designer. Generate exactly ${count} engaging live polling questions for topic: "${topic}", audience: "${audienceType || 'General'}".
        Question types to mix: 'multiple_choice', 'word_cloud', 'rating', 'true_false'.
        Return ONLY a JSON array of objects with fields: { type, title, subtitle, timerSeconds, options?: [{ id, text, isCorrect }] }. No markdown.
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 1024,
      });

      const responseText = chatCompletion.choices[0]?.message?.content || '[]';
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
      
      const questions = JSON.parse(cleanJson);
      questions.forEach((q: any) => {
        if (q.options) {
          q.options.forEach((opt: any, i: number) => {
            if (!opt.id) opt.id = `opt-${Date.now()}-${i}`;
          });
        }
      });

      return questions;
    } catch (err) {
      console.warn('Groq AI generated smart fallback questions:', err);
    }
  }

  // Instant fallback question set tailored to topic
  return [
    {
      id: `q-ai-1-${Date.now()}`,
      type: 'multiple_choice',
      title: `What is the biggest opportunity in ${topic}?`,
      subtitle: 'Select the option with the highest potential impact',
      timerSeconds: 45,
      options: [
        { id: `opt-1-${Date.now()}`, text: 'Accelerating digital execution & speed', isCorrect: false },
        { id: `opt-2-${Date.now()}`, text: 'Upskilling team collaboration & mindset', isCorrect: false },
        { id: `opt-3-${Date.now()}`, text: 'Standardizing frameworks & operations', isCorrect: false },
        { id: `opt-4-${Date.now()}`, text: 'Leveraging data-driven decision making', isCorrect: false },
      ],
    },
    {
      id: `q-ai-2-${Date.now()}`,
      type: 'word_cloud',
      title: `In 1 or 2 words, describe the current challenge in ${topic}`,
      subtitle: 'Type your keyword below',
      timerSeconds: 45,
      maxWordCount: 2,
    },
    {
      id: `q-ai-3-${Date.now()}`,
      type: 'rating',
      title: `How confident are you in executing strategies related to ${topic}?`,
      subtitle: '1 = Very Low Confidence, 5 = Highly Confident',
      timerSeconds: 30,
      ratingMin: 1,
      ratingMax: 5,
      ratingMinLabel: 'Needs Clarity',
      ratingMaxLabel: 'Fully Confident',
    },
    {
      id: `q-ai-4-${Date.now()}`,
      type: 'true_false',
      title: `Continuous audience feedback directly increases seminar impact and retention.`,
      subtitle: 'True or False',
      timerSeconds: 30,
      points: 100,
      options: [
        { id: `tf-1-${Date.now()}`, text: 'True — Active engagement boosts retention by 60%+', isCorrect: true },
        { id: `tf-2-${Date.now()}`, text: 'False — Passive listening is equally effective', isCorrect: false },
      ],
    }
  ];
}

export async function summarizeAudienceResponses(questionTitle: string, responses: ResponseItem[]) {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY as string) || '';

  if (!responses || responses.length === 0) {
    return {
      summary: 'No audience responses submitted yet.',
      keyThemes: ['Waiting for live submissions from participants'],
      sentiment: 'Neutral',
      moderatorTip: 'Encourage audience members to scan the QR code to participate.',
    };
  }

  if (apiKey) {
    try {
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      const responsesText = responses.map((r: any) => r.textResponse || r.ratingValue || JSON.stringify(r.selectedOptionIds)).join('\n');
      
      const prompt = `
        Analyze audience responses for live polling question: "${questionTitle}"
        Responses:
        ${responsesText}
        
        Return ONLY raw JSON, no markdown formatting.
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 500,
      });

      const text = chatCompletion.choices[0]?.message?.content || '{}';
      let clean = text.trim();
      if (clean.startsWith('```json')) clean = clean.slice(7);
      if (clean.startsWith('```')) clean = clean.slice(3);
      if (clean.endsWith('```')) clean = clean.slice(0, -3);

      return JSON.parse(clean);
    } catch (err) {
      console.warn('AI summary generated analytical fallback:', err);
    }
  }

  return {
    summary: `High audience engagement recorded with ${responses.length} responses. Overall participation shows strong alignment across key topics.`,
    keyThemes: ['Strong audience involvement', 'Consensus on practical execution', 'Active live feedback'],
    sentiment: 'Positive & Engaged',
    moderatorTip: 'Highlight the highest voted option and invite a brief comment from the floor.',
  };
}

