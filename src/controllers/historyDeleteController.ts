import { Request, Response } from 'express';
import { deleteHistoryById } from '../db/deleteHistoryById';
import { deleteFileIfExists } from '../utils/mediaStorage';

export async function deleteHistoryController(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // 1. Удаляем файлы
    deleteFileIfExists(id, 'png');
    deleteFileIfExists(id, 'mp3');

    // 2. Удаляем запись из БД
    await deleteHistoryById(id);

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Ошибка удаления истории:', error);
    res.status(400).json({ error: error.message || 'Ошибка удаления истории' });
  }
}
