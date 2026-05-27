import { Request, Response, NextFunction } from 'express';
import { getJobById } from '../services/history/getHistoryJobStatus';

export const getHistoryJobStatus = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const user = (req as any).user;

    const job = getJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    if (job.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    return res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      result: job.result,
    });
  } catch (err) {
    next(err);
  }
};
