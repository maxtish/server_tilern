import { v4 as uuidv4 } from 'uuid';
import { History } from '../../types/hystory';
import { getLocalMediaPath } from '../../utils/mediaStorage';
import { insertHistory } from '../../db/historyDB';
import { transcribeMp3 } from '../transcribe/transcribeTilern';
import { processStoryWithGPT } from '../gpt/processStoryWithGPT';
import { generateImage } from '../gpt/generateImage';
import { generateTTS } from '../tts/generateTTS';
import { analyzeWords } from '../gpt/analyzeWords';
import { linkTokenTimingToText } from '../gpt/linkTokenTimingToText';
import { removeLineBreaks } from '../../utils/splitGermanText';
import { analyzeGrammar } from '../gpt/analyzeGrammar';

export const buildHistory = async (initialHistory: string): Promise<History> => {
  const fixedInitialHistory = removeLineBreaks(initialHistory);
  const parsedStory: History = {
    title: { de: '', ru: '' },
    description: '',
    fullStory: { de: fixedInitialHistory, ru: '' },
    languageLevel: 'A1',
    id: uuidv4(),
    viewsCount: 0,
    likesCount: 0,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    authorName: 'AI Story Generator',
    authorRole: 'ADMIN',
    words: [],
    sentences: [],
    tokenTiming: [],
    audioUrl: '',
    imageUrl: '',
  };

  // --- 1. GPT обработка
  console.log('1/8 GPT обработка');
  const ctx = await processStoryWithGPT(fixedInitialHistory);
  parsedStory.title = ctx.title;
  parsedStory.description = ctx.description;
  parsedStory.fullStory = ctx.fullStory;
  parsedStory.languageLevel = ctx.languageLevel;

  // --- 2. Генерация изображения
  console.log('2/8 Генерация изображения');
  parsedStory.imageUrl = await generateImage(fixedInitialHistory, parsedStory.id);

  // --- 3. Генерация TTS
  console.log('3/8 TTS генерация .mp3');
  parsedStory.audioUrl = await generateTTS(parsedStory.fullStory.de, parsedStory.id);

  // --- 4. Транскрипция
  console.log('4/8-1 получаем .mp3');
  const localPath = getLocalMediaPath(parsedStory.id, 'mp3');
  console.log('4/8-2 Транскрипция из .mp3');
  const data = await transcribeMp3(localPath);
  console.log('✅ 4/8 Транскрипция из .mp3');
  parsedStory.tokenTiming = data.words;

  // --- 5. Линковка таймингов
  console.log('5/8 Линковка таймингов');
  const linked = await linkTokenTimingToText(parsedStory.fullStory.de, parsedStory.tokenTiming);
  parsedStory.tokenTiming = linked;
  console.log('✅ 5/8 Линковка таймингов готово');

  // --- 6. Анализ слов
  console.log('6/8 Анализ слов');
  parsedStory.words = await analyzeWords(fixedInitialHistory, parsedStory.tokenTiming);

  // --- 7. Сохранение
  console.log('7/8 Анализ грамматики');
  parsedStory.sentences = await analyzeGrammar(parsedStory.fullStory.de, parsedStory.languageLevel);

  // --- 8. Сохранение
  console.log('8/8 Сохранение');
  await insertHistory(parsedStory);

  return parsedStory;
};
