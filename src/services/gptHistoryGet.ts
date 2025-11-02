import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { History, StoryTiming, Word, WordTiming } from '../types/hystory';
import { splitGermanText } from '../utils/splitGermanText';

import { downloadAndStoreImage, getLocalMediaPath, saveBuffer } from '../utils/mediaStorage';
import { insertHistory } from '../db/historyDB';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// --- 3️⃣ Генерация истории через GPT ---
export const historyGetGPT = async (initialHistory: string): Promise<History> => {
  const emptyStory = {
    title: { ru: '', de: '' },
    description: '',
    fullStory: { de: '', ru: '' },
    languageLevel: '',
  };

  // --- 4️⃣ Запрос к ChatGPT ---
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: `Ты профессиональный переводчик немецких историй, определи уровень немецкого языка и запиши в languageLevel. в fullStory запиши полный текст истории на немецком и перевод на русский.
Заполни строго JSON в формате, как в этом примере:
${JSON.stringify(emptyStory, null, 2)}. 
Инструкция по заполнению полей:
- title.de — короткий заголовок истории на немецком
- title.ru — перевод заголовка на русский
- fullStory.de — полный текст истории на немецком
- fullStory.ru — перевод всей истории на русский
- languageLevel — оцени уровень немецкого A1–C2

Ответ должен быть только в формате JSON.`,
      },
      { role: 'user', content: initialHistory },
    ],
  });

  const contentA = completion.choices[0].message?.content || '';
  let parsedStory: History;

  try {
    parsedStory = JSON.parse(contentA);
  } catch (e) {
    console.error('Ошибка парсинга JSON из ответа GPT:', e);
    console.log('Сырой ответ:', contentA);
    throw new Error('GPT не вернул корректный JSON.');
  }

  // --- 5️⃣ Добавляем ID и сохраняем ---
  parsedStory.id = uuidv4();
  parsedStory.viewsCount = 0;
  parsedStory.likesCount = 0;
  parsedStory.createdDate = new Date().toISOString();
  parsedStory.updatedDate = new Date().toISOString();
  parsedStory.authorName = 'AI Story Generator';
  parsedStory.authorRole = 'ADMIN';

  // --- 🔹 5️⃣ Разбиваем текст на слова
  const words = splitGermanText(parsedStory.fullStory.de);

  // --- 🔹 6️⃣ Формируем промпт для анализа слов
  const prompt = `
Ты — профессиональный преподаватель немецкого языка.
Проанализируй немецкий текст и верни JSON-массив объектов слов.

Каждый элемент — это объект формата:
{
  "type": "verb" | "noun" | "other",
  "word": string | { "singular": string; "plural": string },
  "translation": string // перевод на русский с учётом контекста
}

Правила:
1. Если слово — существительное:
   - включи формы единственного и множественного числа;
   - в единственном числе добавляй артикль (der, die, das) перед словом;
   - в форме множественного числа добавляй артикль "die" (если существует);
   - если множественное число отсутствует, ставь null;
   Пример: 
   {
     "type": "noun",
     "word": { "singular": "der Hund", "plural": "die Hunde" },
     "translation": "собака"
   }

2. Если слово — артикль (der, die, das, ein, eine, einen, einer и т.д.):
   - тип ставь "other";
   - перевод давай в контексте (например, "определённый артикль мужского рода").

3. Если слово — глагол, переводи в контексте (например, "geht" → "идёт").

4. Используй только JSON, без комментариев, без текста перед или после JSON.


Текст:
${parsedStory.fullStory.de}

Слова:
${words.join(', ')}
`;

  // --- 🔹 7️⃣ Запрос к ChatGPT для анализа слов
  const completionWords = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const contentB = completionWords.choices[0]?.message?.content?.trim();
  if (!contentB) throw new Error('Пустой ответ от OpenAI при анализе слов');

  try {
    // Ищем JSON-массив в ответе
    const jsonMatch = contentB.match(/\[.*\]/s);
    if (!jsonMatch) throw new Error('Не удалось найти JSON в ответе GPT (analyze words)');

    const parsedWords: Word[] = JSON.parse(jsonMatch[0]);
    parsedStory.words = parsedWords; // <---- вот ключевая строка!
  } catch (err) {
    console.error('❌ Ошибка парсинга JSON для слов:', err);
    console.error('Ответ GPT:', contentB);
    parsedStory.words = [];
  }

  // --- 🔹 8️⃣ Генерация изображения

  const imageResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `
    Create a high-quality, realistic illustration based on the following story.
    Analyze the text to understand its setting, characters, emotions, and key objects.
    The image should visually represent the story's main idea or mood.
    Do not include any text, words, or labels on the image.
    Use a natural color palette and cinematic lighting.
    
    Story content:
    """${initialHistory}"""
  `,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl: string = imageResponse.data && imageResponse.data[0]?.url ? imageResponse.data[0].url : 'НЕТ URL';

  let imageUrlPublic = '';
  if (imageUrl) {
    imageUrlPublic = await downloadAndStoreImage(parsedStory.id, imageUrl);
  }

  parsedStory.imageUrl = imageUrlPublic || 'НЕТ URL';

  ////////////////////////////////////////////////////////////////////////////////
  // -------------------------------
  // 1️⃣ Генерация аудио через TTS
  // -------------------------------
  const textToSpeak = parsedStory.fullStory.de; // ✅ правильный текст для озвучки

  const ttsResponse = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts', // или "tts-1", "tts-1-hd"
    voice: 'alloy',
    input: textToSpeak,
    response_format: 'mp3',
    speed: 1.0,
  });

  const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
  const audioUrl = await saveBuffer(parsedStory.id, audioBuffer, 'mp3');
  parsedStory.audioUrl = audioUrl;

  // -------------------------------
  // 2️⃣ Распознаем аудио через Whisper для таймингов
  // -------------------------------
  const audioPath = getLocalMediaPath(parsedStory.id, 'mp3');
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json', // чтобы получить сегменты с таймингами
    temperature: 0,
  });

  // -------------------------------
  // 3️⃣ Формируем wordTiming[]
  // -------------------------------
  const wordTiming: WordTiming[] = [];

  if (transcription.segments && transcription.segments.length > 0) {
    transcription.segments.forEach((segment: any) => {
      const words = segment.text.trim().split(/\s+/);
      const duration = segment.end - segment.start;
      const wordDuration = duration / words.length;

      words.forEach((word: string, idx: number) => {
        wordTiming.push({
          word,
          start: segment.start + idx * wordDuration,
          end: segment.start + (idx + 1) * wordDuration,
        });
      });
    });
  }

  // -------------------------------
  // 4️⃣ Сохраняем тайминги в JSON
  // -------------------------------
  const storyTiming: StoryTiming = {
    text: textToSpeak, // ✅ теперь определено
    wordTiming,
  };

  const timingFilename = `${parsedStory.id}-timing.json`;
  const timingPath = path.join(AUDIO_DIR, timingFilename);
  fs.writeFileSync(timingPath, JSON.stringify(storyTiming, null, 2));

  parsedStory.wordTiming = wordTiming;

  /////////////////////////////////////////////////////////////////////////////////

  // --- 🔹 9️⃣ Сохраняем историю

  await insertHistory(parsedStory);

  console.log('✅ История успешно сохранена:', parsedStory.title.de);
  return parsedStory;
};
