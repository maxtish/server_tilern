import OpenAI from 'openai';
import dotenv from 'dotenv';
import { TokenTiming, Word } from '../../types/hystory';
import { transformWordTiming } from '../../utils/transformWordTiming';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Основная функция анализа
 */
export const analyzeWords = async (initialHistory: string, tokenTiming: TokenTiming[]): Promise<Word[]> => {
  const allWords: Word[] = transformWordTiming(tokenTiming);

  // 1. РАЗБИВКА НА ЧАСТИ (Chunking)
  // Для gpt-4o-mini оптимально 15-20 слов за раз, чтобы не терять точность
  const CHUNK_SIZE = 15;
  const wordChunks: Word[][] = [];

  for (let i = 0; i < allWords.length; i += CHUNK_SIZE) {
    wordChunks.push(allWords.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Начинаем анализ: ${allWords.length} слов, ${wordChunks.length} чанков.`);

  const processedWords: Word[] = [];

  for (const [index, chunk] of wordChunks.entries()) {
    try {
      console.log(`Обработка чанка ${index + 1}/${wordChunks.length}...`);
      const analyzedChunk = await processChunkWithAI(chunk);
      processedWords.push(...analyzedChunk);
    } catch (err) {
      console.error(`Ошибка в чанке ${index + 1}:`, err);
      // Если чанк упал, добавляем исходные данные, чтобы не ломать весь массив
      processedWords.push(...chunk);
    }
  }

  return processedWords;
};

/**
 * Вспомогательная функция для одного запроса к API
 */
async function processChunkWithAI(chunk: Word[]): Promise<Word[]> {
  const systemPrompt = `
Du bist ein Linguistik-Expert für Deutsch. Анализируй массив немецких слов.
Для каждого объекта заполни:
- type: часть речи (Artikel, Substantiv, Verb, Adjektiv, Pronomen, Präposition, Numeral, Konjunktion, Partikel).
- baseForm: 
  • Существительные: ед. число + артикль (der Hund).
  • Глаголы: инфинитив. Если приставка отделяемая (trennbar), восстанови её (напр. "aufstehen").
  • Числительные: прописью (напр. "тридцать" -> "dreißig").
  • Аббревиатуры: полная расшифровка.
- plural: форма мн. числа для существительных (die Hunde). Для остальных — "".
- translation: перевод на русский.

ВАЖНО:
1. Поле "word" НЕ ИЗМЕНЯТЬ.
2. Возвращай строго JSON-объект с ключом "results".
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // или 'gpt-4o' для еще более высокой точности
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Обработай эти слова и верни JSON: ${JSON.stringify(chunk)}` },
    ],
    temperature: 0, // Минимум креатива — максимум точности
    response_format: { type: 'json_object' }, // Гарантирует валидный JSON
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return chunk;

  const parsed = JSON.parse(content);
  return parsed.results || parsed; // Берем массив из ключа results
}
