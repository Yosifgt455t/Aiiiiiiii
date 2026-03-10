
export enum InteractionMode {
  QA = 'QA',
  EXPLAIN = 'EXPLAIN',
  QUIZ = 'QUIZ',
  TEACH_ME = 'TEACH_ME',
  SUMMARY = 'SUMMARY',
  FLASHCARDS = 'FLASHCARDS',
  CORRECT_MY_WORK = 'CORRECT_MY_WORK',
  VISUALIZE = 'VISUALIZE'
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'slate';

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
}

export interface User {
  username: string;
  email: string;
  points: number;
  joinedAt: string;
  isPremium?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  mode?: InteractionMode;
  imageUrl?: string;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
}

export interface PDFData {
  name: string;
  base64: string;
  mimeType: string;
}

export interface ChatHistoryEntry {
  id: string;
  title: string;
  pdf: PDFData | null;
  messages: ChatMessage[];
  timestamp: string;
}
