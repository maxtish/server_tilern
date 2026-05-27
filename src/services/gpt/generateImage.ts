import OpenAI from 'openai';
import dotenv from 'dotenv';
import { downloadAndStoreImage, saveBase64Image } from '../../utils/mediaStorage';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateImage = async (initialHistory: string, id: string): Promise<string> => {
  const imageResponse = await openai.images.generate({
    model: 'gpt-image-1',
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
    quality: 'medium',
  });

  const image = imageResponse.data?.[0];

  if (image?.b64_json) {
    return saveBase64Image(id, image.b64_json);
  }

  if (image?.url) {
    return downloadAndStoreImage(id, image.url);
  }

  throw new Error('IMAGE_GENERATION_NO_DATA');
};
