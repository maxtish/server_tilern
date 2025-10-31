import routes from './routes/index';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

const app = express();

app.use(express.json());

// Статика для изображений
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

// Для POST данных формы
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Все роуты
app.use('/', routes);

// Middleware для обработки ошибок
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Ошибка на сервере:', err);

  // Если запрос пришел с fetch/ajax
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(500).json({ error: 'Internal Server Error', details: err.message || err });
  }

  // Для браузера можно вернуть HTML страницу с ошибкой
  res.status(500).send(`
    <h1>500 — Ошибка на сервере</h1>
    <p>${err.message || 'Что-то пошло не так'}</p>
    <p><a href="/">Вернуться на главную</a></p>
  `);
});

console.log('App routes configured.');
export default app;
