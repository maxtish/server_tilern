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

interface UserContext {
  id: string;
  name: string;
  role: string;
}

type BuildHistoryProgress = {
  onStepStart?: (step: string) => void;
  onStepDone?: (step: string, progress: number) => void;
  onStepError?: (step: string, error: any) => void;
};

export const buildHistory = async (
  initialHistory: string,
  user: UserContext,
  progress?: BuildHistoryProgress,
): Promise<History> => {
  const runStep = async <T>(key: string, percent: number, fn: () => Promise<T>): Promise<T> => {
    try {
      progress?.onStepStart?.(key);
      const result = await fn();
      progress?.onStepDone?.(key, percent);
      return result;
    } catch (error) {
      progress?.onStepError?.(key, error);
      throw error;
    }
  };

  console.log('🧹 Подготовка текста');
  const fixedInitialHistory = removeLineBreaks(initialHistory);
  const isPublic = user.role === 'ADMIN';

  const parsedStory: History = {
    title: { de: '', ru: '' },
    authorId: user.id,
    isPublic,
    description: '',
    fullStory: { de: fixedInitialHistory, ru: '' },
    languageLevel: 'A1',
    id: uuidv4(),
    viewsCount: 0,
    likesCount: 0,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    authorName: user.name,
    authorRole: user.role,
    words: [],
    sentences: [],
    tokenTiming: [],
    audioUrl: '',
    imageUrl: '',
  };

  console.log('1/8 GPT обработка');
  const ctx = await runStep('gpt', 15, () => processStoryWithGPT(fixedInitialHistory));

  parsedStory.title = ctx.title;
  parsedStory.description = ctx.description;
  parsedStory.fullStory = ctx.fullStory;
  parsedStory.languageLevel = ctx.languageLevel;

  console.log('2/8 Генерация изображения');
  parsedStory.imageUrl = await runStep('image', 30, () => generateImage(fixedInitialHistory, parsedStory.id));

  console.log('3/8 TTS генерация .mp3');
  parsedStory.audioUrl = await runStep('tts', 45, () => generateTTS(parsedStory.fullStory.de, parsedStory.id));

  console.log('4/8 Транскрипция из .mp3');
  const data = await runStep('transcribe', 60, async () => {
    const localPath = getLocalMediaPath(parsedStory.id, 'mp3');
    console.log('🎧 MP3 path:', localPath);
    return transcribeMp3(localPath);
  });

  parsedStory.tokenTiming = data.words;

  console.log('5/8 Линковка таймингов');

  parsedStory.tokenTiming = await runStep('timing', 70, async () =>
    linkTokenTimingToText(parsedStory.fullStory.de, parsedStory.tokenTiming),
  );

  console.log('6/8 Анализ слов');
  parsedStory.words = await runStep('words', 82, () => analyzeWords(fixedInitialHistory, parsedStory.tokenTiming));

  console.log('7/8 Анализ грамматики');
  parsedStory.sentences = await runStep('grammar', 95, () =>
    analyzeGrammar(parsedStory.fullStory.de, parsedStory.languageLevel),
  );

  console.log('8/8 Сохранение');
  await runStep('save', 100, () => insertHistory(parsedStory));

  console.log('✅ История полностью создана:', parsedStory.id);

  return parsedStory;
};
