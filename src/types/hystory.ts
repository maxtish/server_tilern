export interface History {
  id: string;
  title: { de: string; ru: string };
  description: string;
  fullStory: {
    ru: string;
    de: string;
  };
  languageLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  imageUrl: string;
  audioUrl: string;
  tokenTiming: TokenTiming[];
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

export interface TokenTiming {
  word: string;
  start: number | null;
  end: number | null;
}

export interface TranscribeResponse {
  language: string;
  duration: number;
  words: TokenTiming[];
}

// Тип слова
/////// Общий интерфейс для слова

export type Word = {
  type: string;
  word: string;
  plural: string;
  baseForm: string;
  translation: string;
};

export interface StoryTiming {
  tokenTiming: TokenTiming[];
}

///// ДЛЯ generateStory
export interface ProcessStoryWithGPT {
  title: { de: string; ru: string };
  description: string;
  fullStory: {
    ru: string;
    de: string;
  };
  languageLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
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
  token_timing: TokenTiming[];
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
  token_timing: history.tokenTiming,
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
  tokenTiming: dbHistory.token_timing,
  words: dbHistory.words,
  createdDate: dbHistory.created_at,
  updatedDate: dbHistory.updated_at,
  authorName: dbHistory.author_name,
  authorRole: dbHistory.author_role,
  viewsCount: dbHistory.views_count,
});

// --- Интерфейс для таблицы UserWords ---
export interface DBUserWord {
  id: string;
  user_id: string;
  history_id: string | null;
  word: Word; //
  created_at: string; // timestamp в формате ISO
}

// --- Унифицированная модель для фронтенда ---
export interface UserWord {
  id: string;
  userId: string;
  historyId?: string | null;
  word: Word;
  createdAt: string;
}

// --- Фронтенд → База данных ---
export const mapUserWordToDB = (userWord: UserWord): DBUserWord => ({
  id: userWord.id,
  user_id: userWord.userId,
  history_id: userWord.historyId ?? null,
  word: userWord.word,
  created_at: userWord.createdAt,
});

// --- База данных → Фронтенд ---
export const mapDBToUserWord = (dbUserWord: DBUserWord): UserWord => ({
  id: dbUserWord.id,
  userId: dbUserWord.user_id,
  historyId: dbUserWord.history_id,
  word: dbUserWord.word,
  createdAt: dbUserWord.created_at,
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
