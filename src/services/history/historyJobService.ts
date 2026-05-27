import crypto from 'crypto';
import { buildHistory } from './buildHistory';

export type HistoryJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type HistoryJobStepStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type HistoryJobStep = {
  key: string;
  title: string;
  status: HistoryJobStepStatus;
  error?: string;
};

export type HistoryJob = {
  id: string;
  userId: string;
  status: HistoryJobStatus;
  progress: number;
  steps: HistoryJobStep[];
  error?: string;
  resultHistoryId?: string;
  createdAt: string;
  updatedAt: string;
};

const jobs = new Map<string, HistoryJob>();

const createSteps = (): HistoryJobStep[] => [
  { key: 'gpt', title: 'GPT обработка текста', status: 'pending' },
  { key: 'image', title: 'Генерация изображения', status: 'pending' },
  { key: 'tts', title: 'Генерация аудио', status: 'pending' },
  { key: 'transcribe', title: 'Транскрипция аудио', status: 'pending' },
  { key: 'timing', title: 'Связь текста с аудио', status: 'pending' },
  { key: 'words', title: 'Анализ слов', status: 'pending' },
  { key: 'grammar', title: 'Анализ грамматики', status: 'pending' },
  { key: 'save', title: 'Сохранение истории', status: 'pending' },
];

export async function createHistoryJob(payload: {
  story: string;
  user: { id: string; name: string; role: string };
}): Promise<HistoryJob> {
  const now = new Date().toISOString();

  const job: HistoryJob = {
    id: crypto.randomUUID(),
    userId: payload.user.id,
    status: 'queued',
    progress: 0,
    steps: createSteps(),
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(job.id, job);

  console.log(`🚀 [JOB ${job.id}] Создана задача`);
  console.log(`👤 [JOB ${job.id}] User: ${payload.user.id}, role: ${payload.user.role}`);

  processJob(job.id, payload).catch((error) => {
    console.error(`❌ [JOB ${job.id}] Ошибка создания истории:`, error);

    updateJob(job.id, {
      status: 'failed',
      progress: 100,
      error: error?.message || 'Ошибка создания истории',
    });
  });

  return job;
}

async function processJob(
  jobId: string,
  payload: {
    story: string;
    user: { id: string; name: string; role: string };
  },
) {
  console.log(`⚙️ [JOB ${jobId}] Старт обработки`);

  updateJob(jobId, {
    status: 'processing',
    progress: 1,
  });

  const history = await buildHistory(payload.story, payload.user, {
    onStepStart: (stepKey) => {
      console.log(`▶️ [JOB ${jobId}] START step: ${stepKey}`);
      setStep(jobId, stepKey, 'processing');
    },

    onStepDone: (stepKey, progress) => {
      console.log(`✅ [JOB ${jobId}] DONE step: ${stepKey}, progress: ${progress}%`);
      setStep(jobId, stepKey, 'completed');
      updateJob(jobId, { progress });
    },

    onStepError: (stepKey, error) => {
      console.error(`❌ [JOB ${jobId}] FAILED step: ${stepKey}`, error);
      setStep(jobId, stepKey, 'failed', error?.message || 'Ошибка шага');
    },
  });

  updateJob(jobId, {
    status: 'completed',
    progress: 100,
    resultHistoryId: history.id,
  });

  console.log(`🎉 [JOB ${jobId}] История готова: ${history.id}`);
}

function updateJob(jobId: string, patch: Partial<HistoryJob>) {
  const job = jobs.get(jobId);
  if (!job) return;

  jobs.set(jobId, {
    ...job,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

function setStep(jobId: string, stepKey: string, status: HistoryJobStepStatus, error?: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  updateJob(jobId, {
    steps: job.steps.map((step) => (step.key === stepKey ? { ...step, status, error } : step)),
  });
}

export function getHistoryJob(jobId: string): HistoryJob | undefined {
  return jobs.get(jobId);
}

export function getUserHistoryJobs(userId: string): HistoryJob[] {
  return [...jobs.values()]
    .filter((job) => job.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
