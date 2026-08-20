import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import aiRoutes from './ai_routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow frontend domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Init Supabase Service Role client for backend
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// ROUTES
// ==========================================
app.use('/api/ai', aiRoutes);

// --- Event Management ---
app.post('/api/events', async (req, res) => {
  const authHeader = req.headers.authorization;
  // TODO: verify authHeader if needed
  
  const { title, description, category, organizerName, questions } = req.body;
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .insert({
        room_code: roomCode,
        title,
        description,
        category,
        organizer_name: organizerName,
        status: 'waiting'
      })
      .select()
      .single();

    if (evtErr) throw evtErr;

    if (questions && questions.length > 0) {
      const qInserts = questions.map((q: any, i: number) => ({
        event_id: event.id,
        type: q.type,
        title: q.title,
        subtitle: q.subtitle,
        sort_order: i,
        timer_seconds: q.timerSeconds,
        options: q.options,
        rating_min: q.ratingMin,
        rating_max: q.ratingMax,
        rating_min_label: q.ratingMinLabel,
        rating_max_label: q.ratingMaxLabel
      }));
      await supabase.from('questions').insert(qInserts);
    }

    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Join Event ---
app.post('/api/join', async (req, res) => {
  const { roomCode, name, avatarEmoji } = req.body;

  try {
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .select('id')
      .ilike('room_code', roomCode.trim())
      .single();

    if (evtErr || !event) return res.status(404).json({ error: 'Room not found' });

    const { data: participant, error: partErr } = await supabase
      .from('participants')
      .insert({
        event_id: event.id,
        name,
        avatar_emoji: avatarEmoji
      })
      .select()
      .single();

    if (partErr) throw partErr;

    res.json({ eventId: event.id, participant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Submit Response ---
app.post('/api/events/:id/respond', async (req, res) => {
  const { id: event_id } = req.params;
  const { participantId, participantName, questionId, selectedOptionIds, textResponse, ratingValue, timeTakenSeconds } = req.body;

  try {
    // Upsert response to prevent duplicate votes from same participant on same question
    const { error } = await supabase
      .from('responses')
      .upsert({
        event_id,
        participant_id: participantId,
        participant_name: participantName,
        question_id: questionId,
        selected_option_ids: selectedOptionIds || [],
        text_response: textResponse,
        rating_value: ratingValue,
        time_taken_seconds: timeTakenSeconds || 0
      }, { onConflict: 'participant_id,question_id' });

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Moderator Controls ---
app.post('/api/events/:id/control', async (req, res) => {
  const { id } = req.params;
  const { action, payload } = req.body;

  try {
    const { data: event, error: evtErr } = await supabase.from('events').select('*').eq('id', id).single();
    if (evtErr) throw evtErr;

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
          reveal_answer: false
        };
        break;
      case 'prev_question':
        updates = {
          current_question_index: Math.max(0, event.current_question_index - 1),
          is_timer_running: false,
          is_voting_locked: false,
          show_results_on_projector: false,
          reveal_answer: false
        };
        break;
      case 'start_timer':
        updates = {
          is_timer_running: true,
          question_started_at: new Date().toISOString()
        };
        break;
      case 'stop_timer':
        updates = { is_timer_running: false };
        break;
      case 'add_time':
        updates = { timer_remaining_seconds: event.timer_remaining_seconds + (payload.seconds || 15) };
        break;
      case 'lock_voting':
        updates = { is_voting_locked: true, is_timer_running: false };
        break;
      case 'unlock_voting':
        updates = { is_voting_locked: false };
        break;
      case 'toggle_results':
        updates = { show_results_on_projector: payload.show };
        break;
      case 'reveal_answer':
        updates = { reveal_answer: true, show_results_on_projector: true };
        break;
      case 'simulate_crowd':
        // Handle simulation
        return handleSimulateCrowd(id, payload.count || 10, res);
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


// Helper for simulate crowd
async function handleSimulateCrowd(eventId: string, count: number, res: express.Response) {
  try {
    const { data: event } = await supabase.from('events').select('current_question_index').eq('id', eventId).single();
    const { data: questions } = await supabase.from('questions').select('*').eq('event_id', eventId).order('sort_order');
    if (!event || !questions) return res.json({ success: false });

    const currentQ = questions[event.current_question_index];
    if (!currentQ) return res.json({ success: false });

    for (let i = 0; i < count; i++) {
      const pId = crypto.randomUUID();
      const pName = `Sim_${Math.floor(Math.random() * 1000)}`;
      
      // create participant
      await supabase.from('participants').insert({ id: pId, event_id: eventId, name: pName });

      // create response
      let opts = {};
      if (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') {
        const optionIds = currentQ.options.map((o: any) => o.id);
        const randOpt = optionIds[Math.floor(Math.random() * optionIds.length)];
        opts = { selected_option_ids: [randOpt] };
      } else if (currentQ.type === 'rating') {
        opts = { rating_value: Math.floor(Math.random() * 5) + 1 };
      } else if (currentQ.type === 'word_cloud') {
        const words = ['Awesome', 'Great', 'Inspiring', 'Confusing', 'Boring', 'Insightful'];
        opts = { text_response: words[Math.floor(Math.random() * words.length)] };
      }

      await supabase.from('responses').insert({
        event_id: eventId,
        participant_id: pId,
        participant_name: pName,
        question_id: currentQ.id,
        ...opts
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ==========================================
// BACKGROUND TIMER TICKER
// ==========================================
// This replaces the in-memory timer. It queries Supabase every second
// for events where is_timer_running = true and decrements the timer.

setInterval(async () => {
  try {
    // 1. Get all events with running timers
    const { data: runningEvents, error } = await supabase
      .from('events')
      .select('id, timer_remaining_seconds')
      .eq('is_timer_running', true);

    if (error || !runningEvents) return;

    // 2. Decrement and update
    for (const evt of runningEvents) {
      if (evt.timer_remaining_seconds > 0) {
        await supabase
          .from('events')
          .update({ timer_remaining_seconds: evt.timer_remaining_seconds - 1 })
          .eq('id', evt.id);
      } else if (evt.timer_remaining_seconds <= 0) {
        // Auto-lock when timer hits 0
        await supabase
          .from('events')
          .update({ 
            is_timer_running: false,
            is_voting_locked: true 
          })
          .eq('id', evt.id);
      }
    }
  } catch (err) {
    console.error('Timer tick error:', err);
  }
}, 1000);

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
