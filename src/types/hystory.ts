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

// Существительное —  с формами
export interface NounWord extends BaseWord {
  type: 'noun';
  word: { singular: string; plural: string }; // немецкое слово в ед. и мн. числе
}

// Глагол или другое — просто слово
export interface SimpleWord extends BaseWord {
  type: 'verb' | 'other';
  word: string; // немецкое слово
}

export type Word = NounWord | SimpleWord;
