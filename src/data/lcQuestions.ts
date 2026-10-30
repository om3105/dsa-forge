import mapJson from './leetcode-map.json';
import type { LcQuestion } from '../types';

export const LC_QUESTIONS = (mapJson as { questions: LcQuestion[] }).questions;
export const LC_BY_ID: Record<string, LcQuestion> = Object.fromEntries(LC_QUESTIONS.map((q) => [q.id, q]));
