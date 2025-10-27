import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { History } from '../types/hystory';
import { downloadImage } from '../utils/downloadImage';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const historyFilePath = path.join(__dirname, '../../data/history.json');

// --- 1️⃣ Чтение истории ---
export const readHistory = (): History[] => {
  if (!fs.existsSync(historyFilePath)) return [];
  const data = fs.readFileSync(historyFilePath, 'utf-8').trim();
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// --- 2️⃣ Сохранение новой истории (добавление в массив, а не перезапись) ---
export const saveHistory = (story: History) => {
  const histories = readHistory();
  histories.push(story);
  fs.writeFileSync(historyFilePath, JSON.stringify(histories, null, 2), 'utf-8');
};

// --- 3️⃣ Генерация истории через GPT ---
export const historyGetGPT = async (): Promise<History> => {
  const emptyStory: History = {
    id: ' ',
    title: { ru: '', de: '' },
    description: '',
    fullStory: { de: '', ru: '' },
    languageLevel: 'A1',
    image: '',
    isNew: true,
    audioUrl: '',
    wordTiming: [],
    words: [],
  };

  const initialHistory =
    'Der Vulkan ist ein Berg, aus dem heiße Lava, Asche und Gas kommen. Wenn ein Vulkan aktiv ist, kann er ausbrechen. Die Lava ist sehr heiß und fließt den Berg hinunter. Viele Vulkane liegen in Italien, Island und Japan.';

  // --- 4️⃣ Запрос к ChatGPT ---
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `Ты — классификатор и переводчик немецких историй. 
Заполни строго JSON в формате, как в этом примере:
${JSON.stringify(emptyStory, null, 2)}.

Описание полей:
- title.de — короткий заголовок истории (на немецком)
- title.ru — перевод заголовка на русский
- fullStory.de — полный текст истории (на немецком)
- fullStory.ru — перевод всей истории на русский
- languageLevel — оцени уровень немецкого (A1–C2)
- words - Включай абсолютно все слова, даже очень короткие или служебные: der, die, das, ist, ein, eine, und и т. д. все что есть в тексте, а в поле translation указывай перевод с учетом контекста истории. 
  Если существительное — укажи артикли { singular, plural }. вот типизация ----
export type Word = {
  type: 'verb' | 'other' | 'noun';
  word: string | { singular: string; plural: string };
  translation: string;
};
----
- audioUrl — оставь пустым ''
Ответ должен быть только в формате JSON.`,
      },
      { role: 'user', content: initialHistory },
    ],
  });

  const gptText = completion.choices[0].message?.content || '';
  let parsedStory: History;

  try {
    parsedStory = JSON.parse(gptText);
  } catch (e) {
    console.error('Ошибка парсинга JSON из ответа GPT:', e);
    console.log('Сырой ответ:', gptText);
    throw new Error('GPT не вернул корректный JSON.');
  }

  // --- 5️⃣ Добавляем ID и сохраняем ---
  parsedStory.id = uuidv4();

  // 6 Генерация изображения

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

  let localImagePath = '';
  // если URL существует, скачиваем
  if (imageUrl) {
    const fileName = `${parsedStory.id}.png`;
    localImagePath = await downloadImage(imageUrl, fileName);
  }

  parsedStory.image = localImagePath || 'https://via.placeholder.com/1024?text=No+Image';

  saveHistory(parsedStory);

  console.log('✅ История успешно сохранена:', parsedStory.title.de);
  return parsedStory;
};
