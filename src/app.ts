import routes from './routes/index';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

// Для POST данных формы
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Раздача статических файлов из public
app.use('/media', express.static(path.join(__dirname, '../public/media')));

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
