import { Word, TokenTiming } from '../types/hystory';
import { splitGermanTextSimple } from './splitGermanText';

function normalizeGermanWord(word: string): string {
  return (
    word
      // убираем пунктуацию только в конце слова
      .replace(/[.,!?;:()„“"«»]+$/g, '')

      .trim()
  );
}

export function transformWordTiming(tokenTiming: TokenTiming[]): Word[] {
  return tokenTiming.map(({ word }) => ({
    type: '',
    word: normalizeGermanWord(word),
    plural: '',
    baseForm: '',
    translation: '',
  }));
}

export function transformWord(text: string): Word[] {
  const tokenTiming: string[] = splitGermanTextSimple(text);
  return tokenTiming.map((word) => ({
    type: '',
    word: word,
    plural: '',
    baseForm: '',
    translation: '',
  }));
}
