// ============================================
// PulseLive — Type Definitions
// ============================================

export type EventStatus = 'draft' | 'waiting' | 'live' | 'paused' | 'ended';

export type QuestionType = 'multiple_choice' | 'open_text' | 'rating' | 'word_cloud' | 'true_false';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  colorIndex?: number;
}

export type RatingStyle = 'numeric' | 'stars' | 'likert' | 'emoji';

export interface Question {
  id: string;
  event_id?: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  sort_order?: number;
  options?: QuestionOption[];
  ratingMin?: number;
  ratingMax?: number;
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  ratingStyle?: RatingStyle;
  ratingLabels?: string[];
  timerSeconds: number;
  allowMultiple?: boolean;
  maxWordCount?: number;
  points?: number;
  category?: string;
}

export interface ResponseItem {
  id: string;
  event_id?: string;
  participantId: string;
  participantName: string;
  questionId: string;
  selectedOptionIds?: string[];
  textResponse?: string;
  ratingValue?: number;
  submittedAt: number;
  timeTakenSeconds?: number;
}

export interface Participant {
  id: string;
  event_id?: string;
  name: string;
  joinedAt: number;
  avatarBg: string;
  avatarEmoji?: string;
  score?: number;
}

export interface LiveReaction {
  id: string;
  event_id?: string;
  emoji: string;
  senderName?: string;
  timestamp: number;
}

export interface EventData {
  id: string;
  roomCode: string;
  title: string;
  description: string;
  category: string;
  organizerName: string;
  organizerId?: string;
  createdAt: number;
  status: EventStatus;
  currentQuestionIndex: number;
  questionStartedAt?: number;
  timerRemainingSeconds?: number;
  isTimerRunning: boolean;
  showResultsOnProjector: boolean;
  isVotingLocked: boolean;
  revealAnswer: boolean;
  isQuizMode?: boolean;
  questions: Question[];
  participants: Participant[];
  responses: ResponseItem[];
  reactions: LiveReaction[];
}

export type ActiveAppView =
  | 'participant'
  | 'presenter'
  | 'projector'
  | 'admin'
  | 'analytics'
  | 'login';

// ============================================
// Supabase DB Row Types (snake_case)
// ============================================

export interface DbEvent {
  id: string;
  room_code: string;
  title: string;
  description: string;
  category: string;
  organizer_name: string;
  organizer_id: string | null;
  status: EventStatus;
  current_question_index: number;
  question_started_at: string | null;
  timer_remaining_seconds: number;
  is_timer_running: boolean;
  show_results_on_projector: boolean;
  is_voting_locked: boolean;
  reveal_answer: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbQuestion {
  id: string;
  event_id: string;
  type: QuestionType;
  title: string;
  subtitle: string;
  sort_order: number;
  timer_seconds: number;
  points: number;
  options: QuestionOption[];
  rating_min: number;
  rating_max: number;
  rating_min_label: string;
  rating_max_label: string;
  max_word_count: number;
  allow_multiple: boolean;
  created_at: string;
}

export interface DbParticipant {
  id: string;
  event_id: string;
  name: string;
  avatar_bg: string;
  avatar_emoji: string;
  score: number;
  joined_at: string;
}

export interface DbResponse {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name: string;
  question_id: string;
  selected_option_ids: string[];
  text_response: string | null;
  rating_value: number | null;
  time_taken_seconds: number;
  submitted_at: string;
}

export interface DbReaction {
  id: string;
  event_id: string;
  emoji: string;
  sender_name: string;
  created_at: string;
}

// ============================================
// Converters: DB Row → Frontend Model
// ============================================

export function dbEventToFrontend(
  row: DbEvent,
  questions: Question[],
  participants: Participant[],
  responses: ResponseItem[],
  reactions: LiveReaction[]
): EventData {
  return {
    id: row.id,
    roomCode: row.room_code,
    title: row.title,
    description: row.description || '',
    category: row.category || 'General Session',
    organizerName: row.organizer_name || 'Moderator',
    organizerId: row.organizer_id || undefined,
    createdAt: new Date(row.created_at).getTime(),
    status: row.status,
    currentQuestionIndex: row.current_question_index,
    questionStartedAt: row.question_started_at ? new Date(row.question_started_at).getTime() : undefined,
    timerRemainingSeconds: row.timer_remaining_seconds !== null && row.timer_remaining_seconds !== undefined
      ? row.timer_remaining_seconds
      : (questions[row.current_question_index]?.timerSeconds || 45),
    isTimerRunning: row.is_timer_running,
    showResultsOnProjector: row.show_results_on_projector,
    isVotingLocked: row.is_voting_locked,
    revealAnswer: row.reveal_answer,
    questions,
    participants,
    responses,
    reactions,
  };
}

export function dbQuestionToFrontend(row: DbQuestion): Question {
  return {
    id: row.id,
    event_id: row.event_id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle || '',
    sort_order: row.sort_order,
    timerSeconds: row.timer_seconds,
    points: row.points || 0,
    options: row.options || [],
    ratingMin: row.rating_min,
    ratingMax: row.rating_max,
    ratingMinLabel: row.rating_min_label || 'Low',
    ratingMaxLabel: row.rating_max_label || 'High',
    maxWordCount: row.max_word_count,
    allowMultiple: row.allow_multiple,
  };
}

export function dbParticipantToFrontend(row: DbParticipant): Participant {
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    joinedAt: new Date(row.joined_at).getTime(),
    avatarBg: row.avatar_bg || '#2563EB',
    avatarEmoji: row.avatar_emoji || '👋',
    score: row.score || 0,
  };
}

export function dbResponseToFrontend(row: DbResponse): ResponseItem {
  return {
    id: row.id,
    event_id: row.event_id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    questionId: row.question_id,
    selectedOptionIds: row.selected_option_ids || [],
    textResponse: row.text_response || undefined,
    ratingValue: row.rating_value || undefined,
    timeTakenSeconds: row.time_taken_seconds || 0,
    submittedAt: new Date(row.submitted_at).getTime(),
  };
}

export function dbReactionToFrontend(row: DbReaction): LiveReaction {
  return {
    id: row.id,
    event_id: row.event_id,
    emoji: row.emoji,
    senderName: row.sender_name || 'Audience',
    timestamp: new Date(row.created_at).getTime(),
  };
}
