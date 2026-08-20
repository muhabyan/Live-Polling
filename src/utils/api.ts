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

// ============================================
// 1. SUPABASE QUERIES (Fetch operations)
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
  description?: string;
  category?: string;
  organizerName?: string;
  questions?: Partial<Question>[];
}) {
  const session = await getSession();
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

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
      timer_remaining_seconds: 45,
      is_timer_running: false,
      show_results_on_projector: true,
      is_voting_locked: false,
      reveal_answer: false,
    })
    .select()
    .single();

  if (evtErr) throw new Error(evtErr.message);

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
    const { error: qErr } = await supabase.from('questions').insert(qInserts);
    if (qErr) console.warn('Questions insert warning:', qErr);
  }

  return event;
}

export async function updateExistingEvent(id: string, eventData: Partial<EventData>) {
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEventById(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================
// 4. PARTICIPANT ACTIONS (Direct Supabase)
// ============================================

export async function joinEventByCode(code: string, name: string, emoji?: string) {
  const { data: event, error: evtErr } = await supabase
    .from('events')
    .select('id')
    .ilike('room_code', code.trim())
    .single();

  if (evtErr || !event) {
    throw new Error('Room code not found. Please check the code.');
  }

  const avatarBgs = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
  const randomBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

  const { data: participant, error: partErr } = await supabase
    .from('participants')
    .insert({
      event_id: event.id,
      name: name.trim(),
      avatar_bg: randomBg,
      avatar_emoji: emoji || '👋',
      score: 0,
    })
    .select()
    .single();

  if (partErr) throw new Error(partErr.message);

  return {
    eventId: event.id,
    participant: dbParticipantToFrontend(participant as DbParticipant),
  };
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
  const { error } = await supabase
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

  if (error) throw new Error(error.message);
  return { success: true };
}

// ============================================
// 5. MODERATOR CONTROLS (Direct Supabase)
// ============================================

export async function sendControlAction(eventId: string, action: string, payload?: any) {
  const { data: event, error: evtErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (evtErr || !event) throw new Error('Event not found');

  let updates: any = {};

  switch (action) {
    case 'start_session':
      updates = { status: 'live' };
      break;
    case 'end_session':
      updates = { status: 'ended', is_timer_running: false };
      break;
    case 'next_question':
      updates = {
        current_question_index: event.current_question_index + 1,
        is_timer_running: false,
        is_voting_locked: false,
        show_results_on_projector: false,
        reveal_answer: false,
      };
      break;
    case 'prev_question':
      updates = {
        current_question_index: Math.max(0, event.current_question_index - 1),
        is_timer_running: false,
        is_voting_locked: false,
        show_results_on_projector: false,
        reveal_answer: false,
      };
      break;
    case 'start_timer':
      updates = {
        is_timer_running: true,
        question_started_at: new Date().toISOString(),
      };
      break;
    case 'stop_timer':
      updates = { is_timer_running: false };
      break;
    case 'add_time':
      updates = { timer_remaining_seconds: (event.timer_remaining_seconds || 0) + (payload?.seconds || 15) };
      break;
    case 'lock_voting':
      updates = { is_voting_locked: true, is_timer_running: false };
      break;
    case 'unlock_voting':
      updates = { is_voting_locked: false };
      break;
    case 'toggle_results':
      updates = { show_results_on_projector: payload?.show ?? !event.show_results_on_projector };
      break;
    case 'reveal_answer':
      updates = { reveal_answer: true, show_results_on_projector: true };
      break;
    case 'simulate_crowd':
      return handleSimulateCrowdDirect(eventId, payload?.count || 10);
    default:
      return;
  }

  const { error } = await supabase.from('events').update(updates).eq('id', eventId);
  if (error) throw new Error(error.message);
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

  for (let i = 0; i < count; i++) {
    const pId = crypto.randomUUID();
    const pName = `Audience_${Math.floor(Math.random() * 900 + 100)}`;
    
    simParticipants.push({
      id: pId,
      event_id: eventId,
      name: pName,
      avatar_bg: '#2563EB',
      avatar_emoji: '👋',
    });

    let opts: any = {};
    if (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') {
      const optionIds = (currentQ.options || []).map((o: any) => o.id);
      const randOpt = optionIds[Math.floor(Math.random() * optionIds.length)];
      opts = { selected_option_ids: randOpt ? [randOpt] : [] };
    } else if (currentQ.type === 'rating') {
      opts = { rating_value: Math.floor(Math.random() * 5) + 1 };
    } else if (currentQ.type === 'word_cloud') {
      const words = ['Innovative', 'Insightful', 'Engaging', 'Fast', 'Clear', 'Powerful', 'Dynamic'];
      opts = { text_response: words[Math.floor(Math.random() * words.length)] };
    } else if (currentQ.type === 'open_text') {
      const thoughts = ['Great presentation!', 'Very clear explanation', 'Looking forward to more details'];
      opts = { text_response: thoughts[Math.floor(Math.random() * thoughts.length)] };
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
// 7. GROQ AI (Client & Optional)
// ============================================

export async function generateAIQuestions(topic: string, audienceType: string, count: number = 4): Promise<Question[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;
  if (!apiKey) {
    console.warn('Groq API key not configured');
    return [];
  }

  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    const prompt = `
      You are an expert event engagement strategist. I am hosting a presentation on the topic: "${topic}".
      My target audience is: "${audienceType || 'General Audience'}".
      
      Generate exactly ${count} interactive polling questions to ask my audience to keep them engaged.
      Mix the question types between: 'multiple_choice', 'word_cloud', 'rating', and 'true_false'.
      
      Return ONLY a valid JSON array of question objects matching this exact TypeScript structure:
      
      type QuestionType = 'multiple_choice' | 'open_text' | 'rating' | 'word_cloud' | 'true_false';
      interface QuestionOption { id: string; text: string; isCorrect?: boolean; }
      interface Question {
        type: QuestionType;
        title: string;
        subtitle?: string;
        timerSeconds: number;
        options?: QuestionOption[];
        ratingMin?: number;
        ratingMax?: number;
        ratingMinLabel?: string;
        ratingMaxLabel?: string;
      }
      
      Do NOT wrap the output in markdown blocks (\`\`\`json). Just return the raw JSON array.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
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
    console.error('Groq AI Question Error:', err);
    return [];
  }
}

export async function summarizeAudienceResponses(questionTitle: string, responses: ResponseItem[]) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;
  if (!apiKey) {
    return {
      summary: 'AI insights are currently not active.',
      keyThemes: ['Set VITE_GROQ_API_KEY in Vercel to enable AI analytics'],
      sentiment: 'Neutral',
      moderatorTip: 'Add your Groq API key in Vercel settings to unlock AI summarization.',
    };
  }

  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    const responsesText = (responses || []).map((r: any) => r.textResponse || r.ratingValue || JSON.stringify(r.selectedOptionIds)).join('\n');
    
    const prompt = `
      Analyze the following audience responses for the question: "${questionTitle}"
      
      Responses:
      ${responsesText}
      
      Provide a highly concise JSON summary matching this structure:
      {
        "summary": "2-3 sentence overview of the audience's collective response",
        "keyThemes": ["theme 1", "theme 2", "theme 3"],
        "sentiment": "Positive / Neutral / Negative / Mixed",
        "moderatorTip": "One specific tip on what the presenter should say next based on these results"
      }
      
      Return ONLY raw JSON, no markdown formatting.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 512,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);

    return JSON.parse(cleanJson);
  } catch {
    return {
      summary: 'Could not generate summary at this moment.',
      keyThemes: ['Audience active'],
      sentiment: 'Positive',
      moderatorTip: 'Continue with the presentation schedule.',
    };
  }
}
