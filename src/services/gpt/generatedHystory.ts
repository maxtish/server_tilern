// services/history/buildHistory.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const buildGPTHistory = async (initialStory: string): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `
Ты функция, которая получает текст на русском языке и возвращает сгенерированную не большую историю до 1500 символов на немецком языке.
Ответ строго в формате JSON: { "generatedHistory": "..." }.
Не добавляй пояснений или текста вне JSON.
Если получаешь уже готовую историю, проверь и исправь её.
        `.trim(),
      },
      { role: 'user', content: initialStory },
    ],
  });

  let gptResponse = completion.choices[0].message?.content || '';

  // Обрезаем ```json … ```
  const codeBlockMatch = gptResponse.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    gptResponse = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(gptResponse);
    return parsed.generatedHistory;
  } catch (err) {
    console.error('Ошибка парсинга JSON из ответа GPT:', err);
    console.log('Сырой ответ GPT:', gptResponse);
    throw new Error('GPT не вернул корректный JSON.');
  }
};
