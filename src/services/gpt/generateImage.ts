import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { downloadAndStoreImage } from '../../utils/mediaStorage';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export const generateImage = async (initialHistory: string, id: string): Promise<string> => {
  // --- 🔹 2 Генерация изображения
  const imageResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `
        Create a high-quality, realistic illustration based on the following story.
        Analyze the text to understand its setting, characters, emotions, and key objects.
        The image should visually represent the story's main idea or mood.
        Do not include any text, words, or labels on the image.
        Use a natural color palette and cinematic lighting.
        
        Story content:
        """${initialHistory}"""
      `,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl: string = imageResponse.data && imageResponse.data[0]?.url ? imageResponse.data[0].url : 'НЕТ URL';

  let imageUrlPublic = '';
  if (imageUrl) {
    imageUrlPublic = await downloadAndStoreImage(id, imageUrl);
  }
  return imageUrlPublic;
};
