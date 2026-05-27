import { Request, Response, NextFunction } from 'express';
import { createHistoryJob, getHistoryJob, getUserHistoryJobs } from '../services/history/historyJobService';

type AuthUser = {
  id: string;
  name?: string;
  role: string;
};

export const submitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;
    const user = (req as any).user as AuthUser;

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    if (!story || !story.trim()) {
      return res.status(400).json({ error: 'История не введена' });
    }

    const job = await createHistoryJob({
      story,
      user: {
        id: user.id,
        name: user.name || 'User',
        role: user.role,
      },
    });

    return res.status(202).json(job);
  } catch (err) {
    next(err);
  }
};

export const getHistoryJobStatus = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const user = (req as any).user as AuthUser;

    const job = getHistoryJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    if (job.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    return res.json(job);
  } catch (err) {
    next(err);
  }
};

export const getMyHistoryJobs = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user as AuthUser;

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    return res.json(getUserHistoryJobs(user.id));
  } catch (err) {
    next(err);
  }
};
