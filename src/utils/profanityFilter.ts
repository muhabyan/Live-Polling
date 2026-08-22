/**
 * Profanity and Name Sanitization Engine
 * Handles Indonesian & English slang, vulgarities, leetspeak variations, and acronyms.
 */

// Blocklist of vulgarities, sexual terms, slurs, and toxic swear words
const PROFANITY_PATTERNS = [
  // Indonesian Genitals / Sexual / Anatomy
  'kontol', 'kntl', 'kntol', 'k0nt0l', 'kntool', 'konthol',
  'memek', 'mmk', 'm3m3k', 'meki', 'pepek', 'ppk', 'itil',
  'pentil', 'tetek', 'toket', 'tket', 'peler', 'pler', 'plerr',
  'jembut', 'jmbt', 'jembi', 'pelir', 'butuh',
  'ngentot', 'ngentd', 'ngntt', 'ngntod', 'ngewe', 'ngw', 'ewe',
  'bokep', 'bkep', 'porno', 'sange', 'sangean', 'snge', 'crot',
  'pejuh', 'mani', 'seks', 'sex', 'coly', 'coli', 'onani', 'masturbasi',
  'lonte', 'lont', 'perek', 'bispak', 'jablay', 'jably', 'openbo', 'bo',
  'bencong', 'banci', 'homo', 'gay', 'lesbi',

  // Indonesian Swear Words / Toxic Insults
  'bangsat', 'bangsad', 'bgsd', 'bgst', 'bngst', 'b4ngs4t',
  'bajingan', 'bjngn', 'bajink', 'bjink',
  'jancok', 'jancuk', 'dancok', 'dancuk', 'jnck', 'jncuk', 'ancok', 'ancuk', 'cok',
  'anjing', 'anjg', 'anjir', 'anying', 'anj', 'njing', '4njing',
  'asu', 'asw', 'asuu',
  'tai', 'taek', 'tayek', 'tae',
  'goblok', 'goblog', 'gblk', 'gblg', 'g0bl0k',
  'tolol', 'tlol', 't0l0l', 'bego', 'bgu', 'idiot',
  'babi', 'monyet', 'kampret', 'kmprt',
  'pantek', 'pntk', 'puki', 'pukimak', 'bodoh', 'bdh', 'cacad', 'cacat',
  'setan', 'iblis', 'dajal', 'dajjal',

  // English Profanity & Slurs
  'fuck', 'fck', 'fuk', 'fcking', 'shit', 'sh1t',
  'bitch', 'btch', 'b1tch', 'dick', 'd1ck', 'pussy',
  'asshole', 'cunt', 'cock', 'bastard', 'slut', 'whore',
  'nigger', 'nigga', 'faggot', 'porn', 'xxx'
];

/**
 * Normalizes leetspeak, numbers, and special characters to plain letters
 * Example: "K0nt0l" -> "kontol", "B.a.n.g.s.a.t" -> "bangsat", "M3M3K" -> "memek"
 */
function normalizeLeetspeak(input: string): string {
  let normalized = input.toLowerCase();

  // Replace common leetspeak substitutions
  normalized = normalized
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/\+/g, 't');

  // Strip all non-alphanumeric characters (spaces, dots, underscores, dashes)
  normalized = normalized.replace(/[^a-z0-9]/g, '');

  // Compress repeated characters: "kooontooool" -> "kontol"
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

  return normalized;
}

/**
 * Checks if a string contains prohibited / vulgar words
 */
export function containsProfanity(text: string): boolean {
  if (!text || !text.trim()) return false;

  const rawLower = text.toLowerCase();
  const normalized = normalizeLeetspeak(text);

  // 1. Direct word token check
  const words = rawLower.split(/[\s._\-+/*#!?,@$]+/);
  for (const word of words) {
    if (PROFANITY_PATTERNS.includes(word)) {
      return true;
    }
  }

  // 2. Substring check on normalized leetspeak string
  for (const pattern of PROFANITY_PATTERNS) {
    // Only check substring if pattern length >= 3 to avoid false positives with short abbreviations
    if (pattern.length >= 3) {
      if (normalized.includes(pattern) || rawLower.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates participant name:
 * - Max 20 characters
 * - Allows spaces, multiple words, numbers, and punctuation
 * - Blocks vulgarity
 */
export function validateParticipantName(name: string): {
  isValid: boolean;
  error?: string;
  sanitizedName: string;
} {
  const trimmed = (name || '').trim();

  // If empty, it's valid (system will assign default mascot persona name)
  if (!trimmed) {
    return { isValid: true, sanitizedName: '' };
  }

  // Length check: max 20 characters
  if (trimmed.length > 20) {
    return {
      isValid: false,
      error: 'Nama maksimal 20 karakter agar muat rapi di layar.',
      sanitizedName: trimmed.substring(0, 20),
    };
  }

  // Profanity check
  if (containsProfanity(trimmed)) {
    return {
      isValid: false,
      error: 'Nama mengandung kata yang tidak pantas. Harap gunakan nama yang sopan.',
      sanitizedName: trimmed,
    };
  }

  return {
    isValid: true,
    sanitizedName: trimmed,
  };
}
