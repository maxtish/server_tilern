import { buildHistory } from './buildHistory';

type HistoryJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

type HistoryJob = {
  id: string;
  userId: string;
  status: HistoryJobStatus;
  progress: number;
  error?: string;
  result?: any;
  createdAt: number;
  updatedAt: number;
};

const jobs = new Map<string, HistoryJob>();

export async function createHistoryJob(payload: {
  story: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}) {
  const jobId = crypto.randomUUID();

  const job: HistoryJob = {
    id: jobId,
    userId: payload.user.id,
    status: 'queued',
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobs.set(jobId, job);

  processHistoryJob(jobId, payload).catch((err) => {
    const current = jobs.get(jobId);
    if (!current) return;

    jobs.set(jobId, {
      ...current,
      status: 'failed',
      progress: 100,
      error: err.message || 'Ошибка создания истории',
      updatedAt: Date.now(),
    });
  });

  return job;
}

async function processHistoryJob(
  jobId: string,
  payload: {
    story: string;
    user: {
      id: string;
      name: string;
      role: string;
    };
  },
) {
  updateJob(jobId, {
    status: 'processing',
    progress: 10,
  });

  const generatedStory = await buildHistory(payload.story, payload.user);

  updateJob(jobId, {
    status: 'completed',
    progress: 100,
    result: generatedStory,
  });
}

function updateJob(jobId: string, patch: Partial<HistoryJob>) {
  const job = jobs.get(jobId);
  if (!job) return;

  jobs.set(jobId, {
    ...job,
    ...patch,
    updatedAt: Date.now(),
  });
}

export function getJobById(jobId: string) {
  return jobs.get(jobId);
}
