import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { History, StoryTiming, Word, WordTiming } from '../types/hystory';
import { splitGermanText } from '../utils/splitGermanText';

import { downloadAndStoreImage, getLocalMediaPath, saveBuffer } from '../utils/mediaStorage';
import { insertHistory } from '../db/historyDB';
import { sentenceToSkeleton } from '../utils/sentenceToSkeleton';

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
  let parsedStory: History = {
    title: { de: '', ru: '' },
    description: '',
    fullStory: { de: initialHistory, ru: '' },
    languageLevel: 'A1', // временно
    id: '', // позже присвоим uuid
    viewsCount: 0,
    likesCount: 0,
    createdDate: '',
    updatedDate: '',
    authorName: 'AI Story Generator',
    authorRole: 'ADMIN',
    words: [],
    wordTiming: [],
    audioUrl: '',
    imageUrl: '',
  };

  console.log('Генерация истории через GPT!!!!!!!  ---');
  const emptyStory = {
    title: { ru: '', de: '' },
    description: '',
    fullStory: { de: initialHistory, ru: '' },
    languageLevel: 'A1',
  };

  // --- 4️⃣ Запрос к ChatGPT ---
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `Ты профессиональный переводчик немецких историй, определи уровень немецкого языка и запиши в languageLevel. в fullStory запиши полный текст истории на немецком и перевод на русский.
Заполни строго JSON в том же формате. "interface History {
  title: { de: string; ru: string };
  description: string;
  fullStory: {
    ru: string;
    de: string;
  };
  languageLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';} "
Инструкция по заполнению полей:
- title.de — короткий заголовок истории на немецком
- title.ru — перевод заголовка на русский
- fullStory.de — полный текст истории на немецком
- fullStory.ru — перевод всей истории на русский
- languageLevel — оцени уровень немецкого A1–C2

Ответ должен быть только в формате JSON. Ответ **только** в JSON, без пояснений и текста вокруг.`,
      },
      { role: 'user', content: `${JSON.stringify(emptyStory, null, 2)}` },
    ],
  });

  const contentA = completion.choices[0].message?.content || '';
  // Если есть ```json … ``` обрезаем
  let cleanedContent = contentA.trim();
  const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    cleanedContent = codeBlockMatch[1].trim();
  }
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
  // Попытка парсинга
  try {
    let gptData = {
      title: { de: '', ru: '' },
      description: '',
      fullStory: { de: initialHistory, ru: '' },
      languageLevel: 'A1',
    };
    gptData = JSON.parse(cleanedContent);
    const level = gptData.languageLevel;
    parsedStory.title = gptData.title || { de: '', ru: '' };
    parsedStory.description = gptData.description || '';
    parsedStory.fullStory = gptData.fullStory || { de: initialHistory, ru: '' };
    parsedStory.languageLevel = levels.includes(level as any) ? (level as (typeof levels)[number]) : 'A1';
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
  console.log('Разбиваем текст на слова ---');
  const words: Word[] = sentenceToSkeleton(parsedStory.fullStory.de);
  console.log('ВОТ МАССИВ СЛОВ', JSON.stringify(words, null, 2));
  // --- 🔹 6️⃣ Формируем промпт для анализа слов
  const prompt = `
У меня есть массив немецких слов в формате:
Пожалуйста, заполни поля:  
- type — часть речи на немецком (например, Artikel, Substantiv, Verb, Adjektiv, Pronomen, Präposition)  
- singular — форма в единственном числе. Указывай с артиклем. Если слово не имеет формы единственного числа, оставь пустым ("").
- plural — форма во множественном числе. Указывай с артиклем. Если слово не имеет формы множественного числа, оставь пустым ("").
- translation — перевод на русский язык  
- Если встречаются числа, знаки процентов или величины (например, °C, km, %), заменяй их на текстовое значение (например: "Grad Celsius", "Prozent", "Kilometer").
Выведи результат в том же формате массива JSON.
Пример ожидаемого результата:
[
  { type: "Artikel", word: "Die", plural: "", singular: "", translation: "определённый артикль женского рода" },
  { type: "Substantiv", word: "Traum", plural: "die Träume", singular: "der Traum", translation: "сон" },
  { type: "Verb", word: "haben", plural: "", singular: "", translation: "иметь" } 
]

ВОТ МАССИВ СЛОВ:  ${JSON.stringify(words, null, 2)} 
**Важно:**
1. Заполняй все поля для каждого слова. Ни одно поле не должно быть пропущено.
2. Если слово не подходит для некоторого поля, используй пустую строку "".
3. Ответ должен быть **только JSON**, без текста, объяснений или примечаний.
Ответ **только** в JSON, без пояснений и текста вокруг.
`;

  console.log('Запрос к ChatGPT для анализа слов---');

  // --- 🔹 7️⃣ Запрос к ChatGPT для анализа слов
  const completionWords = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
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
  console.log('Генерация изображения');
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
  console.log('Генерация аудио через TTS');
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

  console.log('Распознаем аудио через Whisper для таймингов');

  const audioPath = getLocalMediaPath(parsedStory.id, 'mp3');
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json', // чтобы получить сегменты с таймингами
    temperature: 0.2,
    language: 'de',
    prompt: 'необходимо точное время произношения слов.',
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
