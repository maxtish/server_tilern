export function tokenizeGermanTextClean(text: string): string[] {
  // 1. Убираем пунктуацию и спецсимволы
  const cleanText = text
    .replace(/[.,!?;:()„“"«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Делим по пробелам
  const words = cleanText.split(' ');

  // 3. Фильтруем возможные пустые строки
  return words.filter(Boolean);
}

export function splitGermanTextSimple(text: string): string[] {
  // 1. Делим по пробелам
  const words = text.split(' ');

  // 2. Фильтруем возможные пустые строки
  return words.filter(Boolean);
}

export function removeLineBreaks(text: string): string {
  return text.replace(/\n/g, ' ');
}
