import { Request, Response } from 'express';
import { deleteHistoryById } from '../db/deleteHistoryById';
import { deleteFileIfExists } from '../utils/mediaStorage';

export async function deleteHistoryController(req: Request, res: Response) {
  const { id } = req.params;

  // 1. Получаем данные пользователя из запроса (установил Auth Middleware)
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Пользователь не авторизован' });
  }

  try {
    // 2. Удаляем запись из БД (передаем ID пользователя и его роль для проверки прав)
    // Эта функция теперь сама проверит: админ это или автор истории
    await deleteHistoryById(id, user.id, user.role);

    // 3. Если удаление из БД прошло успешно — удаляем связанные файлы
    deleteFileIfExists(id, 'png');
    deleteFileIfExists(id, 'mp3');

    res.json({ success: true, message: 'История и связанные файлы удалены' });
  } catch (error: any) {
    console.error('❌ Ошибка удаления истории:', error);

    // Обработка ошибки прав доступа
    if (error.message.includes('нет прав')) {
      return res.status(403).json({ error: error.message });
    }

    // Обработка ошибки "не найдено"
    if (error.message.includes('не найдена')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(400).json({ error: error.message || 'Ошибка удаления истории' });
  }
}
