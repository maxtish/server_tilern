import { TokenTiming, Word } from '../types/hystory';

export function normalizeGermanWord(word: string): string {
  return (
    word
      // убираем пунктуацию только в конце слова
      .replace(/[.,!?;:()„“"«»]+$/g, '')
      // приводим к нижнему регистру
      .toLowerCase()
      .trim()
  );
}

export function buildTiming(indexW: Word[], indexT: TokenTiming[]) {
  let indexR: TokenTiming[] = [];
  let i = 0;
  let k = 0;
  let m = 0;
  let startWordT = true;
  let iReserv = 0;

  while (i < indexT.length) {
    // 1. Совпало по слову
    if (normalizeGermanWord(indexW[k].word) === normalizeGermanWord(indexT[i].word)) {
      indexR[m] = {
        word: indexW[k].word,
        start: indexT[i].start,
        end: indexT[i].end,
      };
      if (i > 0) {
        indexR[m - 1].end = indexT[i - 1].end;
      }
      i++;
      k++;
      m++;
      startWordT = true;
    } else {
      iReserv = iReserv === 0 ? i + 1 : iReserv;
      if (startWordT) {
        indexR[m] = {
          word: indexW[k].word,
          start: indexT[i].start,
          end: null, ///
        };
        startWordT = false;
        i++;
        m++;
        k++;
      } else {
        i++;
        if (i < indexT.length) {
          continue;
        } else {
          if (k < indexW.length) {
            indexR[m - 1].word += ' ' + indexW[k].word;
            k++;
            i = iReserv;
            iReserv = 0;
            continue; // ← force continue cycle from new i
          }
        }
      }
    }
  }

  return indexR;
}
