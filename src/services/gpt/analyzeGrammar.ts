import OpenAI from 'openai';
import dotenv from 'dotenv';
import { SentenceGrammar } from '../../types/hystory';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeGrammar = async (textDe: string, languageLevel: string): Promise<SentenceGrammar[]> => {
  const systemPrompt = `
Ты — опытный преподаватель немецкого языка для русскоговорящих студентов.

Твоя задача — подробно разобрать немецкий текст, как на хорошем уроке, начиная с базовых правил уровня A1 и аккуратно доходя до более сложных (A2 и выше), если они встречаются.

1. Разбей немецкий текст на отдельные предложения.
2. Для каждого предложения дай:
   - "de": оригинальное предложение на немецком языке.
   - "ru": точный и естественный перевод на русский язык.
   - "grammar": понятное и дружелюбное объяснение грамматики на русском языке:
        • объясняй как преподаватель, «человеческим» языком 
        • поясняй падежи, времена, порядок слов, отделяемые глаголы  
        • если есть прилагательные — кратко поясни склонение  
        • если есть устойчивые выражения — объясни их смысл  
        • добавляй 1–2 простых примера  
        • используй Markdown (жирный текст, списки, переносы строк), чтобы было удобно читать с телефона  
        • не делай объяснения слишком длинными, но делай его полезным

Используй уровень сложности, соответствующий уровню языка: ${languageLevel}.

Используй простой язык, живые пояснения и мини-подсказки.

Верни ответ СТРОГО в формате JSON:

{
  "sentences": [
    {
      "de": "...",
      "ru": "...",
      "grammar": "..."
    }
  ]
}

`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Проанализируй этот текст: ${textDe}` },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.sentences || [];
  } catch (err) {
    console.error('❌ Ошибка при анализе грамматики:', err);
    return [];
  }
};
