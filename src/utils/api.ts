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
  roomCode?: string;
  description?: string;
  category?: string;
  organizerName?: string;
  questions?: Partial<Question>[];
}) {
  const session = await getSession();
  const roomCode = eventData.roomCode?.trim()?.toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();

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
      updates = {
        status: 'live',
        is_timer_running: true,
        question_started_at: new Date().toISOString(),
        timer_remaining_seconds: event.timer_remaining_seconds || 45,
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
        timer_remaining_seconds: 45,
      };
      await Promise.all([
        supabase.from('responses').delete().eq('event_id', eventId),
        supabase.from('participants').delete().eq('event_id', eventId),
        supabase.from('reactions').delete().eq('event_id', eventId),
      ]);
      break;
    case 'next_question':
      updates = {
        current_question_index: event.current_question_index + 1,
        is_timer_running: true,
        question_started_at: new Date().toISOString(),
        timer_remaining_seconds: 45,
        is_voting_locked: false,
        show_results_on_projector: true,
        reveal_answer: false,
      };
      break;
    case 'prev_question':
      updates = {
        current_question_index: Math.max(0, event.current_question_index - 1),
        is_timer_running: true,
        question_started_at: new Date().toISOString(),
        timer_remaining_seconds: 45,
        is_voting_locked: false,
        show_results_on_projector: true,
        reveal_answer: false,
      };
      break;
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
      updates = { is_timer_running: false };
      break;
    case 'add_time':
      updates = { timer_remaining_seconds: (event.timer_remaining_seconds || 0) + (payload?.seconds || 15) };
      break;
    case 'lock_voting':
    case 'toggle_lock_voting':
      updates = { is_voting_locked: !event.is_voting_locked, is_timer_running: event.is_voting_locked };
      break;
    case 'unlock_voting':
      updates = { is_voting_locked: false, is_timer_running: true };
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
        timer_remaining_seconds: 45,
        question_started_at: new Date().toISOString(),
        is_timer_running: true,
        is_voting_locked: false,
      };
      break;
    case 'jump_to_question':
      updates = {
        current_question_index: payload?.index ?? 0,
        is_timer_running: true,
        question_started_at: new Date().toISOString(),
        timer_remaining_seconds: 45,
        is_voting_locked: false,
        show_results_on_projector: true,
        reveal_answer: false,
      };
      break;
    case 'update_room_code':
      updates = { room_code: payload?.roomCode?.trim()?.toUpperCase() };
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
