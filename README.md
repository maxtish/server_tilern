# TiLern

**TiLern** — это образовательная платформа для изучения немецкого языка.  
Проект состоит из мобильного приложения на React Native и серверной части на Node.js с TypeScript и Express.

---

## Структура проекта



TiLern/ ← корень проекта
├─ mobile/ ← React Native мобильное приложение
├─ server/ ← Node.js + TypeScript сервер
└─ README.md ← документация проекта


---

## Быстрый старт

### 1. Установка зависимостей

#### Мобильное приложение

```bash

docker-compose down -v  
docker-compose up -d
docker system prune -a --volumes
docker-compose up -d --build
```


Создай общую сеть
```powershell
docker network create shared_network
```




## Структура мобильного приложения

mobile/
 ├─ android/
 ├─ ios/
 ├─ src/           ← исходный код приложения
 │   ├─ components/
 │   ├─ screens/
 │   ├─ hooks/
 │   ├─ api/
 │   └─ ...
 ├─ package.json
 └─ app.json


## Структура сервера

server/
│   package.json
│   tsconfig.json
│   .env
│
├── src/
│   ├── index.ts              # Точка входа сервера
│   ├── app.ts                # Настройка Express приложения
│   ├── routes/
│   │   └── history.ts        # Роут для истории
│   ├── controllers/
│   │   └── historyController.ts
│   ├── services/
│   │   └── gptService.ts     # Работа с GPT API
│   └── utils/
│       └── random.ts         # Вспомогательные функции, например для рандома
│
└── data/
    └── history.json          # JSON файл с примерами истории