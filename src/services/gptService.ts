import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const historyFilePath = path.join(__dirname, '../../data/history.json');

// Чтение истории
export const readHistory = (): any[] => {
  if (!fs.existsSync(historyFilePath)) return [];
  const data = fs.readFileSync(historyFilePath, 'utf-8').trim();
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Перезаписывает history.json новым story
export const saveHistory = (story: any) => {
  fs.writeFileSync(historyFilePath, JSON.stringify([story], null, 2), 'utf-8');
};

// Генерация статьи о мотоциклах
export const generateMotorcycleArticle = async (): Promise<any> => {
  // 1️⃣ Генерация статьи на немецком
  const gptResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a professional journalist and writer specialized in motorcycles.',
      },
      {
        role: 'user',
        content: 'Schreibe einen interessanten Artikel über Motorräder. Kurzer, aber informativer Text.',
      },
    ],
    max_tokens: 500,
  });

  const deText = gptResponse.choices[0].message?.content?.trim() || 'Artikel nicht generiert';

  // 2️⃣ Перевод на русский
  const translationResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Du bist ein professioneller Übersetzer.' },
      { role: 'user', content: `Übersetze den folgenden deutschen Text ins Russische:\n\n${deText}` },
    ],
    max_tokens: 500,
  });

  const ruText = translationResponse.choices[0].message?.content?.trim() || 'Перевод не выполнен';

  // 3️⃣ Генерация изображения

  const imageResponse = await openai.images.generate({
    model: 'dall-e-3', // или другой API
    prompt: `Ein passendes Bild zum Artikel über Motorräder: ${deText}`,
    size: '1024x1024',
  });

  // Безопасный доступ к URL
  const imageUrl =
    imageResponse.data && imageResponse.data[0]?.url
      ? imageResponse.data[0].url
      : 'https://via.placeholder.com/1024?text=No+Image';

  console.log('Generated image URL:', imageUrl);

  // 4️⃣ Формируем JSON объект
  const fullStory = {
    id: uuidv4(),
    de: deText,
    ru: ruText,
    image: imageUrl,
  };

  // Сохраняем в историю
  saveHistory(fullStory);

  console.log('Generated motorcycle article:', fullStory);
  return fullStory;
};
