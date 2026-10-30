import type { CourseId, Flashcard } from '../../types';
import { PATTERN_LABEL, TOPIC_BY_ID } from '../topics';
import { PROBLEMS } from '../problems';
import { CONCEPTS, type ConceptLesson } from './shared';
import { JAVA } from './java';
import { PYTHON } from './python';
import type { FoundationLesson, LangLesson, LanguagePack } from './types';

export const PACKS: Record<CourseId, LanguagePack> = { python: PYTHON, java: JAVA };

export interface LessonView {
  topic: string;
  concept?: ConceptLesson;
  lang?: LangLesson;
  foundation?: FoundationLesson;
}

export function getLesson(course: CourseId, topic: string): LessonView {
  const pack = PACKS[course];
  if (topic === 'lang-basics' || topic === 'lang-collections') return { topic, foundation: pack.foundations[topic] };
  return { topic, concept: CONCEPTS[topic], lang: pack.lessons[topic] };
}

export const hasLesson = (topic: string) => topic !== 'mock';

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/** Auto-generated flashcards for a topic in one course (stable ids so schedules survive updates). */
export function topicCards(course: CourseId, topic: string): Flashcard[] {
  const out: Flashcard[] = [];
  const add = (front: string, back: string) => out.push({ id: `${topic}:${hash(front)}`, topic, front, back, custom: false });
  const view = getLesson(course, topic);
  view.foundation?.cards.forEach((c) => add(c.front, c.back));
  view.concept?.cards.forEach((c) => add(c.front, c.back));
  view.lang?.cards?.forEach((c) => add(c.front, c.back));
  view.concept?.complexity.slice(0, 3).forEach((row) => {
    if (row.time && row.time !== '—') add(`Time complexity of: ${row.what}?`, `${row.time}${row.space && row.space !== '—' ? `, space ${row.space}` : ''}`);
  });
  // "Which pattern solves X?" for this topic's built-in problems
  PROBLEMS.filter((p) => p.topic === topic && p.builtin && p.pattern !== 'design' && p.pattern !== 'simulation').slice(0, 4).forEach((p) => {
    add(`Which pattern solves "${p.title}"? (${p.summary})`, PATTERN_LABEL[p.pattern] ?? p.pattern);
  });
  return out;
}

export function allCards(course: CourseId): Flashcard[] {
  return Object.keys(TOPIC_BY_ID).filter(hasLesson).flatMap((t) => topicCards(course, t));
}
