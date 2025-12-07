import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ProcessStoryWithGPT } from '../../types/hystory';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processStoryWithGPT = async (initialHistory: string): Promise<ProcessStoryWithGPT> => {
  const story: ProcessStoryWithGPT = {
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
      { role: 'user', content: `${JSON.stringify(story, null, 2)}` },
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
    story.title = gptData.title || { de: '', ru: '' };
    story.description = gptData.description || '';
    story.fullStory = gptData.fullStory || { de: initialHistory, ru: '' };
    story.languageLevel = levels.includes(level as any) ? (level as (typeof levels)[number]) : 'A1';
  } catch (e) {
    console.error('Ошибка парсинга JSON из ответа GPT:', e);
    console.log('Сырой ответ:', contentA);
    throw new Error('GPT не вернул корректный JSON.');
  }

  return story;
};
