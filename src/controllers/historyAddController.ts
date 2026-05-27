import { Request, Response, NextFunction } from 'express';
import { createHistoryJob } from '../services/history/getHistoryJobStatus';

export const submitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;
    const user = (req as any).user;

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

    return res.status(202).json({
      jobId: job.id,
      status: job.status,
      message: 'История добавлена в очередь',
    });
  } catch (err) {
    next(err);
  }
};
