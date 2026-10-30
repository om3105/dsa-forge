export type CourseId = 'python' | 'java';
export const COURSES: CourseId[] = ['python', 'java'];
export const COURSE_LABEL: Record<CourseId, string> = { python: 'DSA with Python', java: 'DSA with Java' };

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** Abstract parameter / return types. Each language maps these to its own idiomatic type. */
export type ValueType =
  | 'int' | 'long' | 'double' | 'bool' | 'string'
  | 'int[]' | 'string[]' | 'int[][]' | 'char[][]'
  | 'list<int>' | 'list<string>' | 'list<list<int>>' | 'list<list<string>>'
  | 'ListNode' | 'ListNode[]' | 'TreeNode' | 'void';

export interface Param { name: string; type: ValueType }

export interface FunctionSig {
  kind: 'function';
  /** camelCase name; Python course converts to snake_case */
  name: string;
  params: Param[];
  returns: ValueType;
  /** when returns === 'void', the index of the param whose final value is the answer */
  mutates?: number;
}

export interface DesignMethod { name: string; params: Param[]; returns: ValueType }
export interface DesignSig {
  kind: 'design';
  className: string;
  ctor: Param[];
  methods: DesignMethod[];
}

export type Signature = FunctionSig | DesignSig;

/** How produced output is compared with the expected output */
export type CompareMode = 'exact' | 'unordered' | 'nested-unordered' | 'float';

export interface TestCase {
  /** one JSON value per parameter (function), or [ops, args] for design problems */
  input: unknown[];
  sample?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  topic: string;
  pattern: string;
  difficulty: Difficulty;
  /** one-line prompt used in review mode and lists */
  summary: string;
  /** builtin problems have statement + tests + signature; external ones link out */
  builtin: boolean;
  url?: string;
  statement?: string;
  constraints?: string[];
  signature?: Signature;
  tests?: TestCase[];
  compare?: CompareMode;
  hints?: string[];
}

export interface Topic {
  id: string;
  title: string;
  phase: 1 | 2 | 3 | 4;
  blurb: string;
  /** core patterns this topic contributes to readiness */
  patterns: string[];
}

export interface RoadmapDay {
  day: number;
  phase: 1 | 2 | 3 | 4;
  topic: string;
  title: string;
  focus: string;
  problems: string[];
  minutes: number;
  /** mock interview days */
  mock?: boolean;
}

// ---------- persisted user state ----------

export type ProblemStatus = 'not-started' | 'attempted' | 'solved' | 'solved-with-help';

export interface ProblemLog {
  status: ProblemStatus;
  minutes?: number;
  pattern?: string;
  explanation?: string;
  confidence?: number; // 1..5
  attempts: number;
  wrong: number; // failed submits / needed help count
  updatedAt: number;
  solvedAt?: number;
  /** last time a built-in editor submit passed every test */
  passedAt?: number;
  /** outcome last reported from LeetCode */
  lcResult?: 'solved' | 'solved-with-help' | 'couldnt';
  /** a hint was revealed for this problem */
  helpUsed?: boolean;
  lcAt?: number;
}

export type ReviewKind = 'problem' | 'concept' | 'card';
export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewItem {
  id: string; // `${kind}:${refId}`
  kind: ReviewKind;
  refId: string;
  step: number; // index into intervals; may exceed table (then doubling)
  interval: number; // days
  due: string; // YYYY-MM-DD
  lapses: number;
  reviews: number;
  lastRating?: Rating;
  lastReviewed?: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  front: string;
  back: string;
  custom: boolean;
}

export interface CodeSnapshot { at: number; code: string; passed: number; total: number; source?: 'editor' | 'leetcode' }
export interface CodeRecord { current: string; snapshots: CodeSnapshot[] }

export interface InterviewSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  durationMin: number;
  problemIds: string[];
  plans: Record<string, { brute: string; optimized: string; complexity: string }>;
  results: Record<string, { passed: number; total: number }>;
  checklist: Record<string, boolean>;
  reflection?: string;
}

export interface CourseState {
  version: 1;
  course: CourseId;
  startedOn?: string; // date the course was first opened
  completedDays: Record<number, string>; // day -> date completed
  problems: Record<string, ProblemLog>;
  reviews: Record<string, ReviewItem>;
  customCards: Flashcard[];
  /** auto-generated cards the user has enrolled (seen at least once) live in reviews */
  notes: Record<string, string>; // topicId -> markdown text
  lessonsDone: Record<string, string>; // topicId -> date
  activity: Record<string, number>; // date -> count of actions
  interviews: InterviewSession[];
  /** LeetCode map prerequisite progress */
  templatesReviewed: Record<string, string>; // topicId -> date
  recall: Record<string, string>; // questionId -> date the recall check was passed
  skipPassed: Record<string, string>; // topicId -> date the skip-lock concept quiz was passed
  hintsUsed: Record<string, number>; // questionId -> hints revealed
  /** 7-stage topic flow */
  topics: Record<string, TopicProgress>;
  plans: Record<string, { brute: string; optimized: string; complexity: string; at: number }>; // problemId -> plan
  resolves: Record<string, { pid: string; at: number }>; // topicId -> last re-solve during a topic review
}

export interface TopicProgress {
  understandAt?: number;
  mcq?: number; // best concept-check score
  visualizeAt?: number;
  predict?: { correct: number; total: number };
  patternAt?: number;
  spot?: number; // spot-the-pattern score out of 4
  reopenedAt?: number; // set when a topic review fails: Pattern and Guided must be redone
  reopenCount?: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  pistonUrl: string;
  engine: 'auto' | 'server' | 'browser';
  timeoutMs: number;
  memoryMb: number;
  dailyReviewCap: number;
  lastCourse?: CourseId;
  pythonVersion: string;
  javaVersion: string;
  /** allow unlocking LeetCode questions by passing a short concept quiz instead of the full path */
  skipLock: boolean;
}

export interface LcQuestion {
  id: string;
  number: number;
  title: string;
  url: string;
  premium?: boolean;
  altUrl?: string;
  difficulty: Difficulty;
  day: number;
  topic: string;
  pattern: string;
  summary: string;
  concepts: string[];
  patternTemplate: string | null;
  warmups: string[];
  tools: Record<CourseId, string[]>;
  hints: string[];
}
