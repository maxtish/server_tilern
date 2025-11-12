import { Word } from '../types/hystory';

export function sentenceToSkeleton(text: string): Word[] {
  const tokens: Word[] = [];

  // Разрешаем: буквы, умляуты, цифры, %, °, / и дефисы
  const regex = /[A-Za-zÄÖÜäöüß0-9%°\/-]+/g;
  const matches = text.match(regex);

  if (matches) {
    matches.forEach((word) => {
      tokens.push({
        type: '',
        word: word,
        plural: '',
        singular: '',
        translation: '',
      });
    });
  }

  return tokens;
}
