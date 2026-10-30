import type { Rating, ReviewItem, ReviewKind } from '../types';

/** Base schedule in days. Steps beyond the table keep doubling (60, 120, capped at 180). */
export const INTERVALS = [1, 3, 7, 15, 30];

export function intervalForStep(step: number): number {
  if (step < INTERVALS.length) return INTERVALS[Math.max(0, step)];
  return Math.min(180, 30 * 2 ** (step - INTERVALS.length + 1));
}

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dateKey(new Date());
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** First schedule for a newly solved problem / learned concept / new card. */
export function newItem(kind: ReviewKind, refId: string, opts: { confidence?: number; withHelp?: boolean } = {}): ReviewItem {
  const t = today();
  const conf = opts.confidence ?? 3;
  // Needed help or shaky: tomorrow, and the next interval grows slowly (see review()).
  // Confident (5) and unaided: skip the 1-day step.
  const step = !opts.withHelp && conf >= 5 ? 1 : 0;
  const interval = intervalForStep(step);
  return {
    id: `${kind}:${refId}`, kind, refId, step, interval,
    due: addDays(t, interval), lapses: opts.withHelp || conf <= 2 ? 1 : 0, reviews: 0, createdAt: t,
  };
}

/** Re-solving a problem that is already scheduled (e.g. solved again from the tracker). */
export function rescheduleFromConfidence(item: ReviewItem, confidence: number, withHelp: boolean): ReviewItem {
  const rating: Rating = withHelp || confidence <= 1 ? 'again' : confidence === 2 ? 'hard' : confidence === 5 ? 'easy' : 'good';
  return review(item, rating);
}

export function review(item: ReviewItem, rating: Rating): ReviewItem {
  const t = today();
  let step = item.step;
  let interval: number;
  let lapses = item.lapses;
  switch (rating) {
    case 'again':
      step = 0; interval = 1; lapses += 1;
      break;
    case 'hard':
      // stay on this rung, but come back sooner than its normal interval
      interval = Math.max(1, Math.ceil(intervalForStep(step) / 2));
      break;
    case 'good':
      // items with a history of lapses climb one rung at a time
      step = step + 1;
      interval = intervalForStep(step);
      if (lapses >= 2) interval = Math.max(1, Math.round(interval * 0.7));
      break;
    case 'easy':
      step = step + 2;
      interval = Math.round(intervalForStep(step) * 1.2);
      break;
  }
  return { ...item, step, interval, lapses, due: addDays(t, interval), reviews: item.reviews + 1, lastRating: rating, lastReviewed: t };
}

export const isDue = (item: ReviewItem, on = today()) => item.due <= on;
export const overdueDays = (item: ReviewItem, on = today()) => Math.max(0, daysBetween(item.due, on));

/** Ordering for the daily queue: most overdue first, then shakiest, then problems before cards. */
export function priority(item: ReviewItem, on = today()): number {
  const kindWeight = item.kind === 'problem' ? 2 : item.kind === 'concept' ? 1 : 0;
  return overdueDays(item, on) * 10 + item.lapses * 4 + kindWeight - item.step;
}

export const ratingLabel: Record<Rating, string> = { again: 'Forgot', hard: 'Hard', good: 'Good', easy: 'Easy' };

/** Preview of the next interval for each rating (shown on the buttons). */
export function previewIntervals(item: ReviewItem): Record<Rating, number> {
  return {
    again: review(item, 'again').interval,
    hard: review(item, 'hard').interval,
    good: review(item, 'good').interval,
    easy: review(item, 'easy').interval,
  };
}
