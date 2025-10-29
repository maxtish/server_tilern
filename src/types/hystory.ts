export interface History {
  id: string | null;
  title: { de: string; ru: string };
  description: string;
  fullStory: {
    ru: string;
    de: string;
  };
  languageLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  image: string;
  isNew: boolean;
  audioUrl: string;
  wordTiming: WordTiming[];
  words: Word[];
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
