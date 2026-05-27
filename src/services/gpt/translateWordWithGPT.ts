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
  const targetLanguage = direction === 'de-ru' ? 'Russian' : 'German';

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
      "word": "слово на исходном языке",
      "translation": "перевод слова",
      "note": "короткое пояснение"
    }
  ]
}

Правила:

- field "word" должен содержать слово НА ИСХОДНОМ языке
- field "translation" должен содержать ПЕРЕВОД
- направление перевода определяется пользователем
- не путай языки
- верни 3-5 хороших вариантов
- варианты должны быть короткими
- если это существительное на немецком — добавляй артикль der/die/das
- note всегда пиши на русском
- не используй markdown
- не добавляй текст вне JSON

Пример German -> Russian:

{
  "word": "der Tisch",
  "translation": "стол"
}

Пример Russian -> German:

{
  "word": "стол",
  "translation": "der Tisch"
}
`,
      },
      {
        role: 'user',
        content: `Translate from ${sourceLanguage} to ${targetLanguage}: "${text}"`,
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
