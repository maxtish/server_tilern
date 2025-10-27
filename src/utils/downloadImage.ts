import fs from 'fs';
import path from 'path';

export async function downloadImage(url: string, filename: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ошибка при загрузке изображения: ${response.statusText}`);

  const buffer = await response.arrayBuffer();
  const folder = path.join(__dirname, '../../public/images');

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const filePath = path.join(folder, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));

  // Вернём локальный путь, который можно отдавать клиенту
  return `/images/${filename}`;
}
