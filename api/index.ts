import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Groq } from 'groq-sdk';

dotenv.config();

const app = express();
const router = express.Router();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Groq AI
const groqApiKey = process.env.GROQ_API_KEY || '';
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// ==========================================
// 1. HEALTH CHECK
// ==========================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// 2. EVENT MANAGEMENT ROUTES
// ==========================================

// Create Event
router.post('/events', async (req: Request, res: Response) => {
  const { title, description, category, organizerName, questions } = req.body;
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .insert({
        room_code: roomCode,
        title,
        description: description || '',
        category: category || 'General Session',
        organizer_name: organizerName || 'Moderator',
        status: 'waiting',
        timer_remaining_seconds: 45,
        is_timer_running: false,
        show_results_on_projector: true,
        is_voting_locked: false,
        reveal_answer: false
      })
      .select()
      .single();

    if (evtErr) throw evtErr;

    if (questions && questions.length > 0) {
      const qInserts = questions.map((q: any, i: number) => ({
        event_id: event.id,
        type: q.type,
        title: q.title,
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

    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Event
router.put('/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Event
router.delete('/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. PARTICIPANT ROUTES
// ==========================================

// Join Event
router.post('/join', async (req: Request, res: Response) => {
  const { roomCode, name, avatarEmoji } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: 'Room code and participant name are required' });
  }

  try {
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .select('id')
      .ilike('room_code', roomCode.trim())
      .single();

    if (evtErr || !event) return res.status(404).json({ error: 'Room not found with that code' });

    const avatarBgs = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    const randomBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

    const { data: participant, error: partErr } = await supabase
      .from('participants')
      .insert({
        event_id: event.id,
        name: name.trim(),
        avatar_bg: randomBg,
        avatar_emoji: avatarEmoji || '👋',
        score: 0,
      })
      .select()
      .single();

    if (partErr) throw partErr;

    res.json({ eventId: event.id, participant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Response
router.post('/events/:id/respond', async (req: Request, res: Response) => {
  const { id: event_id } = req.params;
  const { participantId, participantName, questionId, selectedOptionIds, textResponse, ratingValue, timeTakenSeconds } = req.body;

  try {
    const { error } = await supabase
      .from('responses')
      .upsert({
        event_id,
        participant_id: participantId,
        participant_name: participantName,
        question_id: questionId,
        selected_option_ids: selectedOptionIds || [],
        text_response: textResponse || null,
        rating_value: ratingValue || null,
        time_taken_seconds: timeTakenSeconds || 0,
      }, { onConflict: 'participant_id,question_id' });

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. MODERATOR CONTROLS
// ==========================================

router.post('/events/:id/control', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, payload } = req.body;

  try {
    const { data: event, error: evtErr } = await supabase.from('events').select('*').eq('id', id).single();
    if (evtErr || !event) throw new Error('Event not found');

    let updates: any = {};

    switch (action) {
      case 'start_session':
        updates = { status: 'live' };
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
        await Promise.allSettled([
          supabase.from('responses').delete().eq('event_id', id),
          supabase.from('participants').delete().eq('event_id', id),
          supabase.from('reactions').delete().eq('event_id', id),
        ]);
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
        return handleSimulateCrowd(id, payload?.count || 10, res);
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    const { error } = await supabase.from('events').update(updates).eq('id', id);
    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crowd Simulation Helper
async function handleSimulateCrowd(eventId: string, count: number, res: Response) {
  try {
    const { data: event } = await supabase.from('events').select('current_question_index').eq('id', eventId).single();
    const { data: questions } = await supabase.from('questions').select('*').eq('event_id', eventId).order('sort_order');
    if (!event || !questions) return res.json({ success: false });

    const currentQ = questions[event.current_question_index];
    if (!currentQ) return res.json({ success: false });

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
        const thoughts = ['Great session!', 'Looking forward to the demo', 'Very interesting points raised'];
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

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ==========================================
// 5. GROQ AI ROUTES (Optional)
// ==========================================

router.post('/ai/generate-questions', async (req: Request, res: Response) => {
  if (!groq) {
    return res.status(503).json({ error: 'Groq API key not configured' });
  }

  const { topic, audienceType, questionCount = 4 } = req.body;

  try {
    const prompt = `
      You are an expert event engagement strategist. I am hosting a presentation on the topic: "${topic}".
      My target audience is: "${audienceType || 'General Audience'}".
      
      Generate exactly ${questionCount} interactive polling questions to ask my audience to keep them engaged.
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

    res.json({ questions });
  } catch (error: any) {
    console.error('Groq Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate questions with Groq' });
  }
});

router.post('/ai/summarize-responses', async (req: Request, res: Response) => {
  if (!groq) {
    return res.status(503).json({ error: 'Groq API key not configured' });
  }

  const { questionTitle, responses } = req.body;

  try {
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

    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('Groq Summarization Error:', error);
    res.status(500).json({ error: 'Failed to summarize with Groq' });
  }
});

// Mount on both /api and root for maximum compatibility
app.use('/api', router);
app.use('/', router);

export default app;
