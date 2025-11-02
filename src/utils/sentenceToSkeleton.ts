import { Word } from '../types/hystory';

export function sentenceToSkeleton(text: string): Word[] {
  const tokens: Word[] = [];

  // Берём слова с умляутами, числа и %, игнорируем остальные знаки препинания
  const regex = /[A-Za-zÄÖÜäöüß0-9%]+/g;
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
