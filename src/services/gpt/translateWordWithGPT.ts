import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type TranslateDirection = 'de-ru' | 'ru-de';

export type TranslateWordOption = {
  word: string;
  translation: string;
  note?: string;
};

export async function translateWordWithGPT(
  text: string,
  direction: TranslateDirection,
): Promise<TranslateWordOption[]> {
  const sourceLanguage = direction === 'de-ru' ? 'German' : 'Russian';
  const targetLanguage = direction === 'ru-de' ? 'Russian' : 'German';

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Ты помощник-переводчик для приложения изучения немецкого языка.

Отвечай ТОЛЬКО валидным JSON.

Формат ответа:

{
  "options": [
    {
      "word": "слово которое было на входе",
      "translation": "перевод слова",
      "note": "короткое пояснение на русском "
    }
  ]
}

Правила:
- Если слово на немецком переведи на русский
- Если слово на русском переведи на немецкий с правильным артиклем (der/die/das) для существительных
- field "word" должен содержать слово НА ИСХОДНОМ языке
- field "translation" должен содержать ПЕРЕВОД
- направление перевода определяется пользователем
- не путай языки
- верни 3-5 хороших вариантов
- варианты должны быть короткими
- если это существительное на немецком — добавляй артикль der/die/das
- note должно содержать короткое пояснение на русском
- не используй markdown
- не добавляй текст вне JSON

Пример de-ru German -> Russian:

{
  "word": "Tisch",
  "translation": "стол"
}

Пример ru-de Russian -> German:

{
  "word": "стол",
  "translation": "der Tisch"
}
`,
      },
      {
        role: 'user',
        content: `слово которое было на входе: "${text}" . подсказка на какой язык переводить: "${direction}"`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.options)) {
      return [];
    }

    return parsed.options
      .filter((item: any) => item?.word && item?.translation)
      .map((item: any) => ({
        word: String(item.word),
        translation: String(item.translation),
        note: item.note ? String(item.note) : undefined,
      }))
      .slice(0, 5);
  } catch (error) {
    console.error('Ошибка парсинга GPT перевода:', raw);
    return [];
  }
}
