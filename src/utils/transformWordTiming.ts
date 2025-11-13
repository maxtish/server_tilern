import { Word, WordTiming } from '../types/hystory';

export function transformWordTiming(wordTiming: WordTiming[]): Word[] {
  return wordTiming.map(({ word }) => ({
    type: '',
    word,
    plural: '',
    baseForm: '',
    translation: '',
  }));
}
