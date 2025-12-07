import { TokenTiming } from '../../types/hystory';
import { buildTiming } from '../../utils/buildTiming';
import { transformWord } from '../../utils/transformWordTiming';

export function linkTokenTimingToText(originalText: string, tokenTiming: TokenTiming[]): TokenTiming[] {
  const result: TokenTiming[] = buildTiming(transformWord(originalText), tokenTiming);

  return result;
}
