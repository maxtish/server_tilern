import { Request, Response } from 'express';
import { generateMotorcycleArticle, readHistory } from '../services/gptService';

export const generateMotorcycle = async (req: Request, res: Response) => {
  try {
    const article = await generateMotorcycleArticle();
    const history = readHistory();

    // Простейший HTML
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>История мотоциклов</title>
    </head>
    <body>
      <h1>История ID: ${history[0].id}</h1>
      <h2>На немецком:</h2>
      <p>${history[0].de}</p>
      <h2>На русском:</h2>
      <p>${history[0].ru}</p>
      <h2>Изображение:</h2>
      <img src="${history[0].image}" alt="Motorcycle Image" style="max-width:600px;">
    </body>
    </html>
  `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
