export const BOT_TEXTS = {
  menu:
    'Learn Words — ваш словарь.\n\n' +
    '📤 Экспорт — пришлю сюда в чат файл со словами, прогрессом и настройками.\n' +
    '📥 Импорт — выберите файл в приложении или просто пришлите его мне.',
  menuExport: '📤 Экспорт',
  menuImport: '📥 Импорт',
  menuOpen: '📚 Открыть словарь',
  exportPrompt: 'Выгрузить словарь в этот чат:',
  importPrompt: 'Пришлите сюда файл экспорта (.json) или выберите его в приложении:',
  importPickFile: '📂 Выбрать файл',
  importOffer: (fileName: string) => `Импортировать «${fileName}» в словарь?`,
  importThisFile: '📥 Импортировать',
  notAnExport: 'Это не похоже на файл экспорта — нужен .json из «Экспорта».',
  tooLarge: 'Файл больше 20 МБ — Telegram не даёт боту его скачать.',
  exportCaption: '📤 Экспорт словаря',
};
