import { Request, Response, NextFunction } from 'express';
import { readHistory } from '../services/gptHistoryGet';
import { History, Word } from '../types/hystory';

export const getHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history: History[] = readHistory();
    const htmlnewline = ` <h2>Истории пока нет 😢</h2>   <a href="/addhistory" style="
        padding: 10px 20px;
        background: #28a745;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: background 0.2s;
      "
      onmouseover="this.style.background='#218838'"
      onmouseout="this.style.background='#28a745'">
      ➕ Добавить историю
    </a>`;
    if (!history.length) {
      return res.send(htmlnewline);
    }

    // ✅ Функция рендера слова
    const renderWordHTML = (w: Word): string => {
      if (typeof w.word === 'string') {
        // глаголы, артикли и пр.
        return `
          <div class="word">
            <span class="type">${w.type}</span>: 
            <b>${w.word}</b> → ${w.translation}
          </div>`;
      }

      if (typeof w.word === 'object' && w.word !== null) {
        const singular = w.word.singular || '';
        const plural = w.word.plural || '';

        let wordPart = '';
        if (singular && plural) wordPart = `<b>${singular}</b> (${plural})`;
        else if (singular) wordPart = `<b>${singular}</b>`;
        else if (plural) wordPart = `<b>${plural}</b>`;

        return `
          <div class="word">
            <span class="type">${w.type}</span>: 
            ${wordPart} → ${w.translation}
          </div>`;
      }

      return '';
    };

    // ✅ Основной HTML
    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Истории TiLern</title>
      <style>
        body {
          font-family: "Segoe UI", sans-serif;
          background: #f5f7fa;
          margin: 0;
          padding: 20px;
        }
        h1 {
          text-align: center;
          margin-bottom: 40px;
          color: #333;
        }
        .stories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }
        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          padding: 20px;
          overflow: hidden;
          transition: transform 0.2s ease;
        }
        .card:hover {
          transform: scale(1.02);
        }
        .card img {
          width: 100%;
          height: auto;
          border-radius: 12px;
          margin-bottom: 15px;
        }
        .meta {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        .lang {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
        }
        .desc {
          color: #444;
          margin-bottom: 12px;
        }
        .text-block {
          background: #f0f3f9;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 10px;
        }
        .word-list {
          margin-top: 10px;
          background: #fafafa;
          border-radius: 10px;
          padding: 10px;
          font-size: 14px;
        }
        .word {
          margin-bottom: 4px;
        }
        .type {
          font-weight: bold;
          color: #007bff;
        }
      </style>
    </head>
    <body>
      <h1>📚 Истории TiLern</h1>
       <a href="/addhistory" style="
        padding: 10px 20px;
        background: #28a745;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: background 0.2s;
      "
      onmouseover="this.style.background='#218838'"
      onmouseout="this.style.background='#28a745'">
      ➕ Добавить историю
    </a>
      <div class="stories">
        ${history
          .map(
            (story) => `
          <div class="card">
            <img src="${story.image}" alt="Story image" />
            <h2>${story.title.ru || story.title.de}</h2>
            <p class="meta">Уровень языка: <span class="lang">${story.languageLevel || '—'}</span></p>
            <p class="desc">${story.description || ''}</p>

            <div class="text-block">
              <h4>🇩🇪 На немецком:</h4>
              <p>${story.fullStory.de}</p>
            </div>

            <div class="text-block">
              <h4>🇷🇺 На русском:</h4>
              <p>${story.fullStory.ru}</p>
            </div>

            ${
              story.words?.length
                ? `<div class="word-list">
                    <h4>🗣️ Слова:</h4>
                    ${story.words.map(renderWordHTML).join('')}
                  </div>`
                : ''
            }
          </div>
        `
          )
          .join('')}
      </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    next(error); // передаем в централизованный error handler
  }
};
