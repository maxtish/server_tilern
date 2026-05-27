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
You are a dictionary assistant for a German/Russian language learning app.

Return only valid JSON.

JSON format:
{
  "options": [
    {
      "word": "source word or phrase",
      "translation": "translated word or phrase",
      "note": "short explanation in Russian"
    }
  ]
}

Rules:
- Give 3 to 5 useful variants.
- Keep variants short.
- Do not invent long sentences.
- If the input is a single word, prefer dictionary-style translations.
- If translating Russian to German, include German articles for nouns when useful: der/die/das.
- Notes must be in Russian.
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
