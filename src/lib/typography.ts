/**
 * Arabic Kashida / Tatweel utility for elongated letters in headline typography.
 * Supports dynamic stretching of one key word per headline.
 */

// Letters that connect to the following letter in Arabic script
const CONNECTING_LETTERS = new Set([
  'ب', 'ت', 'ث', 'ن', 'ي', 'ئ', 'ى',
  'ج', 'ح', 'خ',
  'س', 'ش',
  'ص', 'ض',
  'ط', 'ظ',
  'ع', 'غ',
  'ف', 'ق',
  'ك', 'ل',
  'م', 'ه',
]);

const TATWEEL = '\u0640'; // ـ

/**
 * Inserts Tatweel (Kashida) characters into an Arabic word at an aesthetically balanced connecting position.
 * @param word The Arabic word to stretch
 * @param count Number of tatweel characters (default: 4)
 */
export function elongateWord(word: string, count: number = 4): string {
  if (!word || word.length < 2) return word;

  const chars = Array.from(word);
  // Look for a suitable connecting letter near the middle or end
  // We avoid the very last letter because it has no following letter to connect to
  let targetIndex = -1;

  // Search backward from 2nd-to-last character for the best elongation position
  for (let i = chars.length - 2; i >= 0; i--) {
    if (CONNECTING_LETTERS.has(chars[i])) {
      targetIndex = i;
      break;
    }
  }

  // If no connecting letter found backward, search forward
  if (targetIndex === -1) {
    for (let i = 0; i < chars.length - 1; i++) {
      if (CONNECTING_LETTERS.has(chars[i])) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex === -1) {
    // If no connecting letter found, return original word
    return word;
  }

  const kashidas = TATWEEL.repeat(Math.max(1, count));
  chars.splice(targetIndex + 1, 0, kashidas);
  return chars.join('');
}
