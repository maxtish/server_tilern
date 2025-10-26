import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { History } from '../types/hystory';
import GNews from '@gnews-io/gnews-io-js';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const gNewsApiKey: string = process.env.GNEWS_API_URL || '';

const historyFilePath = path.join(__dirname, '../../data/history.json');

// Чтение истории
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

// Перезаписывает history.json новым story
export const saveHistory = (story: any) => {
  fs.writeFileSync(historyFilePath, JSON.stringify([story], null, 2), 'utf-8');
};

export const generateArticle = async (): Promise<History> => {
  const client = new GNews(gNewsApiKey);

  // 1️⃣ Получаем новости через клиент GNews
  let newsData;
  try {
    newsData = await client.search('auto', {
      lang: 'de',
      country: 'de',
      max: 2,
      from: '2025-01-01T00:00:00Z',
      to: '2025-12-31T23:59:59Z',
    });
  } catch (err) {
    console.error('GNews API error:', err);
    newsData = { totalArticles: 0, articles: [] };
  }

  // 2️⃣ Берём первую статью или заглушку
  const firstArticle = newsData.articles?.[0] || {
    title: 'No articles available',
    description: 'No description',
    content: 'No content available',
    image: 'https://via.placeholder.com/1024?text=No+Articles',
  };

  const deText =
    firstArticle.content?.trim() ||
    firstArticle.description?.trim() ||
    firstArticle.title?.trim() ||
    'Artikel nicht generiert';

  // 3️⃣ Перевод на русский через GPT
  const translationResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Du bist ein professioneller Übersetzer.' },
      { role: 'user', content: `Übersetze den folgenden deutschen Text ins Russische:\n\n${deText}` },
    ],
    max_tokens: 500,
  });

  const ruText = translationResponse.choices[0].message?.content?.trim() || 'Перевод не выполнен';

  // 4️⃣ Формируем объект истории
  const fullStory: History = {
    id: uuidv4(),
    title: firstArticle.title || 'No title',
    description: firstArticle.description || 'No description',
    de: deText,
    ru: ruText,
    image: firstArticle.image || 'https://via.placeholder.com/1024?text=No+Image',
  };

  // 5️⃣ Сохраняем в history.json
  saveHistory(fullStory);

  console.log('Generated motorcycle article:', fullStory);
  return fullStory;
};
