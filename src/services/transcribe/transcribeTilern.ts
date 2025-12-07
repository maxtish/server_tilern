import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { TranscribeResponse } from '../../types/hystory';

/**
 * Отправляет mp3 файл на FastAPI сервер и возвращает JSON с результатом.
 * @param filePath Локальный путь до mp3 файла
 */
export async function transcribeMp3(filePath: string): Promise<TranscribeResponse> {
  // Проверяем, что файл существует
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Создаём form-data
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post('http://transcribe_tilern:8000/transcribe', formData, {
      headers: formData.getHeaders(),
    });

    // Возвращаем JSON
    return response.data as TranscribeResponse;
  } catch (err: any) {
    console.error('Failed to transcribe:', err.message);
    console.log('Failed to transcribe:', err.message);
    throw err;
  }
}
