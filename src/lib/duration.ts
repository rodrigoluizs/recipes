/**
 * Parse and format free-text cooking durations.
 *
 * Times are authored as free text (e.g. "40 min", "1 hr 10 min") so the parser
 * is best-effort: it returns null when it cannot understand the input, and
 * callers fall back to showing the raw strings.
 */

/** Parse a duration string into whole minutes, or null if unparseable. */
export function parseDuration(input: string | null | undefined): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;

  let total = 0;
  let matched = false;

  const hours = s.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hours) {
    total += parseFloat(hours[1]) * 60;
    matched = true;
  }

  const minutes = s.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
  if (minutes) {
    total += parseFloat(minutes[1]);
    matched = true;
  }

  // Compact form like "1h10" (no minute unit).
  if (!minutes) {
    const compact = s.match(/(\d+)\s*h\s*(\d+)\b/);
    if (compact) {
      total = parseFloat(compact[1]) * 60 + parseFloat(compact[2]);
      matched = true;
    }
  }

  // A bare number is interpreted as minutes.
  if (!matched) {
    const bare = s.match(/^(\d+(?:\.\d+)?)$/);
    if (bare) {
      total = parseFloat(bare[1]);
      matched = true;
    }
  }

  return matched ? Math.round(total) : null;
}

/** Unit labels used when formatting a duration; defaults to English. */
export interface DurationLabels {
  hr: string;
  min: string;
}

const DEFAULT_LABELS: DurationLabels = { hr: 'hr', min: 'min' };

/** Format whole minutes as a human string, e.g. 70 -> "1 hr 10 min". */
export function formatDuration(
  min: number,
  labels: DurationLabels = DEFAULT_LABELS,
): string {
  if (!Number.isFinite(min) || min <= 0) return `0 ${labels.min}`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const parts: string[] = [];
  if (h) parts.push(`${h} ${labels.hr}`);
  if (m) parts.push(`${m} ${labels.min}`);
  return parts.join(' ') || `0 ${labels.min}`;
}

/**
 * Total time from prep + cook. When both parse, returns a formatted sum;
 * otherwise falls back to joining the raw strings.
 */
export function totalTime(
  prep: string,
  cook: string,
  labels: DurationLabels = DEFAULT_LABELS,
): string {
  const p = parseDuration(prep);
  const c = parseDuration(cook);
  if (p !== null && c !== null) return formatDuration(p + c, labels);
  return [prep, cook].filter(Boolean).join(' + ');
}
