import { Request, Response } from 'express';
import { generateArticle, readHistory } from '../services/gptService';
import { History } from '../types/hystory';

export const generateMotorcycle = async (req: Request, res: Response) => {
  try {
    const article = await generateArticle();
    const history: History[] = readHistory();

    // Простейший HTML
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>История </title>
    </head>
    <body>
      <h1>title : ${history[0].title}</h1>
       <h2>description : ${history[0].description}</h2>
      <h3>На немецком:</h3>
      <p>${history[0].de}</p>
      <h3>На русском:</h3>
      <p>${history[0].ru}</p>
      <h3>Изображение:</h3>
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
