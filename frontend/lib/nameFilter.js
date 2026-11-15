// ZoneMeet Display Name Profanity & Nudity Filter
// Protects against English, Hindi, and Hinglish explicit words, sexual terms, and leetspeak bypasses

const BANNED_SUBSTRINGS = [
  // English Nudity & Sexual terms
  'sexy', 'sex', 'horny', 'nude', 'naked', 'nudity', 'porn', 'xxx', 'erotic',
  'vagina', 'penis', 'boob', 'boobs', 'tits', 'pussy', 'milf', 'slut', 'whore',
  'bitch', 'escort', 'callgirl', 'dildo', 'onlyfans', 'sugarbaby', 'sugardaddy',
  'blowjob', 'incest',

  // Hindi & Hinglish Explicit terms
  'choot', 'chut', 'chute', 'lund', 'loda', 'lauda', 'lowda', 'gaand', 'gand',
  'chuchi', 'chuche', 'bhosd', 'bhosda', 'bhosdi', 'mutth', 'muthal', 'chudai',
  'chodo', 'chuda', 'randi', 'raand', 'madarchod', 'behenchod', 'bhenchod',
  'chutiya', 'chutiye', 'gandu', 'jhaat', 'jhat'
];

const BANNED_WHOLE_WORDS = [
  'dick', 'cock', 'cum', 'anal', 'muth', 'chod', 'mc', 'bc',
  'admin', 'moderator', 'staff', 'support'
];

/**
 * Validates a user display name
 * @param {string} rawName 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDisplayName(rawName) {
  if (!rawName || typeof rawName !== 'string') {
    return { valid: false, error: 'Please enter a valid display name.' };
  }

  const trimmed = rawName.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters.' };
  }
  if (trimmed.length > 25) {
    return { valid: false, error: 'Display name cannot exceed 25 characters.' };
  }

  // 1. Phone numbers / WhatsApp numbers (7 or more digits)
  const digitsOnly = trimmed.replace(/[\s\-_.]/g, '');
  if (/\d{7,}/.test(digitsOnly)) {
    return { valid: false, error: 'Phone numbers or contact numbers are not allowed in display names.' };
  }

  // 2. Leetspeak normalization
  let normalized = trimmed.toLowerCase()
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1|!|\|/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5|\$/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');

  // Strip all non-alphanumeric for bypass detection (e.g. s.e.x.y -> sexy)
  const stripped = normalized.replace(/[^a-z0-9]/g, '');

  // Collapsed repeated characters (e.g. seeeexxxy -> sexy)
  const collapsed = stripped.replace(/([a-z])\1+/gi, '$1');

  // Check substrings in both stripped and collapsed
  for (const word of BANNED_SUBSTRINGS) {
    if (stripped.includes(word) || collapsed.includes(word)) {
      return {
        valid: false,
        error: '⚠️ Inappropriate, explicit, or nudity-related words are not allowed. Please choose a clean display name.'
      };
    }
  }

  // 3. Whole words check (tokenized by spaces/punctuation)
  const tokens = trimmed.toLowerCase().split(/[^a-z0-9]+/);
  for (const token of tokens) {
    if (BANNED_WHOLE_WORDS.includes(token)) {
      return {
        valid: false,
        error: '⚠️ Inappropriate, explicit, or reserved words are not allowed. Please choose a clean display name.'
      };
    }
  }

  return { valid: true };
}
