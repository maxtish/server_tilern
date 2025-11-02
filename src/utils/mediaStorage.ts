// src/utils/mediaStorage.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

const BASE_MEDIA_DIR = path.join(__dirname, '../../public/media');
console.log('🗂 BASE_MEDIA_DIR:', BASE_MEDIA_DIR);

/**
 * Генерация пути хранения по id (двухуровневая структура)
 */
export function generateMediaPath(id: string, ext: string): string {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const folder1 = hash.slice(0, 2);
  const folder2 = hash.slice(2, 4);

  const fullDir = path.join(BASE_MEDIA_DIR, folder1, folder2);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
    console.log('📁 Создана папка:', fullDir);
  }

  const filename = `${id}.${ext}`;
  const fullPath = path.join(fullDir, filename);
  console.log('💾 Генерируется путь для сохранения файла:', fullPath);
  return fullPath;
}

/**
 * Возвращает публичный URL
 */
export function getPublicMediaUrl(id: string, ext: string): string {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const folder1 = hash.slice(0, 2);
  const folder2 = hash.slice(2, 4);
  const url = `/media/${folder1}/${folder2}/${id}.${ext}`;
  console.log('🌐 Публичный URL для файла:', url);
  return url;
}

/**
 * Скачивает изображение по URL и сохраняет в правильную папку.
 */
export async function downloadAndStoreImage(id: string, imageUrl: string): Promise<string> {
  const filePath = generateMediaPath(id, 'png');

  console.log('🔗 Скачиваем изображение с URL:', imageUrl);
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, response.data);
  console.log('✅ Изображение сохранено по пути:', filePath);

  return getPublicMediaUrl(id, 'png');
}

/**
 * Сохраняет бинарный буфер (например, аудио)
 */
export async function saveBuffer(id: string, buffer: Buffer, ext: string): Promise<string> {
  const filePath = generateMediaPath(id, ext);
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Буфер сохранен по пути:', filePath);
  return getPublicMediaUrl(id, ext);
}

export function getLocalMediaPath(id: string, ext: string): string {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const folder1 = hash.slice(0, 2);
  const folder2 = hash.slice(2, 4);
  const localPath = path.join(BASE_MEDIA_DIR, folder1, folder2, `${id}.${ext}`);
  console.log('🖥 Локальный путь к файлу:', localPath);
  return localPath;
}
