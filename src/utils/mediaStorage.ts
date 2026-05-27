import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

const BASE_MEDIA_DIR = path.join(__dirname, '../../public/media');

export function generateMediaPath(id: string, ext: string): string {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const folder1 = hash.slice(0, 2);
  const folder2 = hash.slice(2, 4);

  const fullDir = path.join(BASE_MEDIA_DIR, folder1, folder2);

  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }

  return path.join(fullDir, `${id}.${ext}`);
}

export function getPublicMediaUrl(id: string, ext: string): string {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const folder1 = hash.slice(0, 2);
  const folder2 = hash.slice(2, 4);

  return `/media/${folder1}/${folder2}/${id}.${ext}`;
}

export async function downloadAndStoreImage(id: string, imageUrl: string): Promise<string> {
  const filePath = generateMediaPath(id, 'png');

  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  fs.writeFileSync(filePath, response.data);

  return getPublicMediaUrl(id, 'png');
}

export async function saveBase64Image(id: string, b64Json: string): Promise<string> {
  const filePath = generateMediaPath(id, 'png');

  const buffer = Buffer.from(b64Json, 'base64');

  fs.writeFileSync(filePath, buffer);

  return getPublicMediaUrl(id, 'png');
}

export async function saveBuffer(id: string, buffer: Buffer, ext: string): Promise<string> {
  const filePath = generateMediaPath(id, ext);

  fs.writeFileSync(filePath, buffer);

  return getPublicMediaUrl(id, ext);
}

export function getLocalMediaPath(id: string, ext: string): string {
  const hash = crypto.createHash('md5').update(id).digest('hex');
  const folder1 = hash.slice(0, 2);
  const folder2 = hash.slice(2, 4);

  return path.join(BASE_MEDIA_DIR, folder1, folder2, `${id}.${ext}`);
}

export function deleteFileIfExists(id: string, ext: string): void {
  const filePath = getLocalMediaPath(id, ext);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
