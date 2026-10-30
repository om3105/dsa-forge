import type { Card } from './shared';

export interface LangLesson {
  templateTitle?: string;
  template?: string;
  notes: string[];
  mistakes?: string[];
  cards?: Card[];
}

export interface FoundationSection { title: string; body: string; code?: string }
export interface FoundationLesson { intro: string; sections: FoundationSection[]; cards: Card[] }

export interface Gotcha { title: string; body: string; bad?: string; good?: string }

export interface LanguagePack {
  name: string;
  lessons: Record<string, LangLesson>;
  foundations: Record<'lang-basics' | 'lang-collections', FoundationLesson>;
  gotchas: Gotcha[];
}
