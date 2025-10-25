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
cd mobile
npm install
# или
yarn install

#  2. Запуск проекта

cd mobile
# Запуск Metro Bundler
npx react-native start

# В отдельном терминале
npx react-native run-android
# или
npx react-native run-ios

#  Сервер
cd server
# Запуск сервера в режиме разработки
npm run dev
# или
yarn dev
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
 ├─ src/
 │   └─ index.ts      ← точка входа сервера
 ├─ package.json
 └─ tsconfig.json

MIT License