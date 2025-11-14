import app from './app';
import dotenv from 'dotenv';
import { pool, testDB, initDB } from './db/db';
import { ensureUserWordsIndex } from './db/userWordDB';
import { getNgrokUrl } from './utils/ngrok';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Сначала проверяем подключение к базе
(async () => {
  let webhookUrl = process.env.WEBHOOK_URL;
  await testDB();
  await initDB(); // создаём таблицы
  await ensureUserWordsIndex(); // создаём уникальный индекс

  if (!webhookUrl) {
    const ngrokUrl = await getNgrokUrl();
    webhookUrl = `${ngrokUrl}`;
  }

  console.log(`✅ Webhook успешно установлен: ${webhookUrl}`);

  // Если успешно, запускаем сервер
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
