import { Request, Response, NextFunction } from 'express';
import { historyGetGPT } from '../services/gptHistoryGet';

// GET — показываем форму ввода
export const showAddHistoryForm = (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Добавить историю</title>
      <style>
        body { font-family: sans-serif; padding: 40px; background: #f5f7fa; }
        form { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);}
        textarea { width: 100%; height: 150px; margin-bottom: 15px; padding: 10px; font-size: 16px; border-radius: 8px; border: 1px solid #ccc; }
        button { padding: 10px 20px; font-size: 16px; border: none; border-radius: 8px; background: #007bff; color: white; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h1>Добавить новую историю</h1>
      <form method="POST" action="/addhistory">
        <label>Введите историю на немецком:</label><br/>
        <textarea name="story" required></textarea><br/>
        <button type="submit">Отправить</button>
      </form>
    </body>
    </html>
  `;
  res.send(html);
};

// POST — получаем историю из формы и запускаем GPT
export const submitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body;
    if (!story) {
      return res.status(400).send('История не введена');
    }

    // Передаем введённый текст в historyGetGPT
    const generatedStory = await historyGetGPT(story); // изменим historyGetGPT чтобы принимал параметр

    res.send(`
      <h2>История успешно сгенерирована!</h2>
      <p><a href="/addhistory">Добавить ещё</a></p>
      <p><a href="/history">Вернуться к списку историй</a></p>
    `);
  } catch (err) {
    next(err); // передаем в централизованный error handler
  }
};
