export type HapticCue = 'crystallize' | 'sealed' | 'reveal';

const PATTERNS: Record<HapticCue, number | number[]> = {
  crystallize: 9,
  sealed: [8, 28, 14],
  reveal: [7, 34, 11],
};

/** Best-effort tactile feedback. Unsupported browsers simply remain silent. */
export function playHaptic(cue: HapticCue): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }
  try {
    return navigator.vibrate(PATTERNS[cue]);
  } catch {
    return false;
  }
}
