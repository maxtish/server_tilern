import fetch from 'node-fetch';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Получение публичного URL ngrok
 */
export async function getNgrokUrl(): Promise<string> {
  console.log('⏳ Ожидание запуска ngrok...');
  await wait(5000); // дать ngrok стартовать

  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch('http://ngrok:4040/api/tunnels');
      if (!res.ok) throw new Error(`ngrok API ${res.statusText}`);

      const data = (await res.json()) as {
        tunnels?: { proto: string; public_url: string }[];
      };

      const tunnel = data?.tunnels?.find((t) => t.proto === 'https');
      if (tunnel?.public_url) {
        console.log(`🌍 Найден ngrok URL: ${tunnel.public_url}`);
        return tunnel.public_url;
      }

      console.log(`⏳ Попытка ${attempt}/20: ngrok ещё не готов...`);
    } catch (err) {
      console.log(`⚠️ Ошибка подключения к ngrok (${attempt}/20):`, (err as Error).message);
    }

    await wait(3000);
  }

  throw new Error('Не удалось получить ngrok URL после ожидания.');
}
