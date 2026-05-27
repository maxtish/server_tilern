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
  // Динамически определяем языки для инструкции
  const isDeToRu = direction === 'de-ru';
  const srcLang = isDeToRu ? 'Немецкий' : 'Русский';
  const tgtLang = isDeToRu ? 'Русский' : 'Немецкий';

  const response = await openai.chat.completions.create({
    // Исправлено на актуальное имя модели gpt-4o-mini, если у вас была опечатка
    model: 'gpt-4o-mini',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Ты профессиональный словарь-переводчик для приложения изучения немецкого языка.
Ты должен строго возвращать только валидный JSON объект.

Формат ответа:
{
  "options": [
    {
      "word": "слово на исходном языке (${srcLang})",
      "translation": "вариант перевода на целевой язык (${tgtLang})",
      "note": "короткое пояснение/контекст на РУССКОМ языке"
    }
  ]
}

Важные правила:
1. Исходный язык: ${srcLang}. Целевой язык: ${tgtLang}.
2. В поле "word" пиши слово исключительно на языке: ${srcLang}. При этом очищай его от артиклей, если это ввод на русском.
3. В поле "translation" пиши перевод исключительно на языке: ${tgtLang}.
4. Если целевой язык Немецкий (${tgtLang}): для существительных ОБЯЗАТЕЛЬНО добавляй артикль (der/die/das).
5. Поле "note" всегда пишется на РУССКОМ языке и содержит краткое пояснение (например, часть речи, контекст или синоним).
6. Верни от 3 до 5 различных популярных вариантов перевода.
7. Не используй markdown разметку вокруг JSON.`,
      },
      {
        role: 'user',
        content: `Переведи слово: "${text}". Направление: с ${srcLang} на ${tgtLang}.`,
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
        word: String(item.word).trim(),
        translation: String(item.translation).trim(),
        note: item.note ? String(item.note).trim() : undefined,
      }))
      .slice(0, 5);
  } catch (error) {
    console.error('Ошибка парсинга GPT перевода:', raw);
    return [];
  }
}
