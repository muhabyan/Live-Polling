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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// ============================================
// SUPABASE DIRECT QUERIES (Read operations)
// ============================================

export async function fetchFullEvent(eventId: string): Promise<EventData | null> {
  const { data: eventRow, error: evtErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (evtErr || !eventRow) return null;

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

  return dbEventToFrontend(eventRow as DbEvent, questions, participants, responses, reactions);
}

export async function fetchAllEvents(): Promise<EventData[]> {
  const { data: eventRows, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !eventRows) return [];

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
  return results;
}

export async function fetchEventByRoomCode(code: string): Promise<EventData | null> {
  const { data: row, error } = await supabase
    .from('events')
    .select('*')
    .ilike('room_code', code.trim().toUpperCase())
    .single();

  if (error || !row) return null;
  return fetchFullEvent(row.id);
}

// ============================================
// BACKEND API CALLS (Write operations via Render)
// ============================================

async function backendFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ---- Auth ----

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

// ---- Events ----

export async function createNewEvent(eventData: {
  title: string;
  description?: string;
  category?: string;
  organizerName?: string;
  questions?: Partial<Question>[];
}) {
  const session = await getSession();
  const token = session?.access_token;
  return backendFetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(eventData),
  });
}

export async function updateExistingEvent(id: string, eventData: Partial<EventData>) {
  const session = await getSession();
  const token = session?.access_token;
  return backendFetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(eventData),
  });
}

export async function deleteEventById(id: string) {
  const session = await getSession();
  const token = session?.access_token;
  return backendFetch(`/api/events/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ---- Participant Actions ----

export async function joinEventByCode(code: string, name: string, emoji?: string) {
  return backendFetch('/api/join', {
    method: 'POST',
    body: JSON.stringify({ roomCode: code, name, avatarEmoji: emoji }),
  });
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
  return backendFetch(`/api/events/${eventId}/respond`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---- Moderator Control ----

export async function sendControlAction(eventId: string, action: string, payload?: any) {
  const session = await getSession();
  const token = session?.access_token;
  return backendFetch(`/api/events/${eventId}/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  });
}

// ---- Reactions (direct to Supabase for speed) ----

export async function sendReactionDirect(eventId: string, emoji: string, senderName: string) {
  const { error } = await supabase.from('reactions').insert({
    event_id: eventId,
    emoji,
    sender_name: senderName,
  });
  if (error) console.warn('Reaction insert error:', error);
}

// ---- AI (Optional - Groq) ----

export async function generateAIQuestions(topic: string, audienceType: string, count: number = 4): Promise<Question[]> {
  try {
    const data = await backendFetch('/api/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ topic, audienceType, questionCount: count }),
    });
    return data.questions || [];
  } catch {
    console.warn('AI question generation unavailable');
    return [];
  }
}

export async function summarizeAudienceResponses(questionTitle: string, responses: ResponseItem[]) {
  try {
    return await backendFetch('/api/ai/summarize-responses', {
      method: 'POST',
      body: JSON.stringify({ questionTitle, responses }),
    });
  } catch {
    console.warn('AI summarization unavailable');
    return {
      summary: 'AI summarization is not available.',
      keyThemes: ['Feature not configured'],
      sentiment: 'Neutral',
      moderatorTip: 'Configure GROQ_API_KEY on the backend to enable AI insights.',
    };
  }
}
