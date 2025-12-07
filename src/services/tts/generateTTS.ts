import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { saveBuffer } from '../../utils/mediaStorage';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export const generateTTS = async (initialHistory: string, storyId: string): Promise<string> => {
  const textToSpeak = initialHistory; // ✅ правильный текст для озвучки

  const ttsResponse = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts', // или "tts-1", "tts-1-hd"
    voice: 'alloy',
    input: textToSpeak,
    response_format: 'mp3',
    speed: 1.0,
  });

  const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
  const audioUrl = await saveBuffer(storyId, audioBuffer, 'mp3');
  return audioUrl;
};
