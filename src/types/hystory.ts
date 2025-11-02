export interface History {
  id: string | null;
  title: { de: string; ru: string };
  description: string;
  fullStory: {
    ru: string;
    de: string;
  };
  languageLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  imageUrl: string;
  audioUrl: string;
  wordTiming: WordTiming[];
  words: Word[];
  createdDate: string; // timestamp в формате ISO
  updatedDate: string; // timestamp в формате ISO
  authorName: string;
  authorRole: string;
  viewsCount: number;
  // 🔹 Убираем likesCount из базы, оставляем только для фронтенда
  likesCount?: number;
  likedByCurrentUser?: boolean; // флаг для фронтенда, чтобы подсветить лайк
}

export interface WordTiming {
  word: string; // слово на немецком
  start: number; // время начала в секундах
  end: number; // время конца в секундах
}

// Тип слова
/////// Общий интерфейс для слова

export interface BaseWord {
  type: WordType; // тип слова
  translation: string; // перевод слова на русский
}
export type WordType = 'noun' | 'verb' | 'other';

export type Word = {
  type: WordType;
  word: string | { singular: string | null; plural: string | null };
  translation: string;
};

export interface StoryTiming {
  text: string;
  wordTiming: WordTiming[];
}

// --- Интерфейс для базы данных ---
export interface DBHistory {
  id: string;
  title: { de: string; ru: string };
  description: string;
  full_story: { de: string; ru: string };
  language_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  image_url: string;
  audio_url: string;
  word_timing: WordTiming[];
  words: Word[];
  created_at: string; // timestamp в формате ISO
  updated_at: string; // timestamp в формате ISO
  author_name: string;
  author_role: string;
  views_count: number;
}

// --- Фронтенд -> База данных ---
export const mapHistoryToDB = (history: History): DBHistory => ({
  id: history.id || '', // будет заполнено при вставке в БД
  title: history.title,
  description: history.description,
  full_story: history.fullStory,
  language_level: history.languageLevel,
  image_url: history.imageUrl,
  audio_url: history.audioUrl,
  word_timing: history.wordTiming,
  words: history.words,
  created_at: history.createdDate || new Date().toISOString(),
  updated_at: history.updatedDate || new Date().toISOString(),
  author_name: history.authorName,
  author_role: history.authorRole,
  views_count: history.viewsCount ?? 0,
});

// --- База данных -> Фронтенд ---
export const mapDBToHistory = (dbHistory: DBHistory): History => ({
  id: dbHistory.id,
  title: dbHistory.title,
  description: dbHistory.description,
  fullStory: dbHistory.full_story,
  languageLevel: dbHistory.language_level,
  imageUrl: dbHistory.image_url,
  audioUrl: dbHistory.audio_url,
  wordTiming: dbHistory.word_timing,
  words: dbHistory.words,
  createdDate: dbHistory.created_at,
  updatedDate: dbHistory.updated_at,
  authorName: dbHistory.author_name,
  authorRole: dbHistory.author_role,
  viewsCount: dbHistory.views_count,
});

/*
Как использовать

Вставка истории в базу:

import { insertHistory } from './historyService';

const history: History = { ... }; // объект из фронтенда
const dbHistory = mapHistoryToDB(history);

await insertHistory(dbHistory);


Чтение истории из базы для фронтенда:

import { getAllHistories } from './historyService';

const dbHistories = await getAllHistories();
const frontendHistories: History[] = dbHistories.map(mapDBToHistory);



*/
