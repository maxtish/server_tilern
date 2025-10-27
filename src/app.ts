import express from 'express';
import historyRouter from './routes/historyGet';
import path from 'path';

const app = express();

app.use(express.json());

// Статика для изображений
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.use('/history', historyRouter);
console.log('App routes configured.');
export default app;
