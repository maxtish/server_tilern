import app from './app';
import dotenv from 'dotenv';
import { pool, testDB, initDB } from './db/db';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Сначала проверяем подключение к базе
(async () => {
  await testDB();
  await initDB(); // создаём таблицы

  // Если успешно, запускаем сервер
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
