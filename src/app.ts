import express from 'express';
import historyRouter from './routes/generate';

const app = express();

app.use(express.json());
app.use('/history', historyRouter);
console.log('App routes configured.');
export default app;
