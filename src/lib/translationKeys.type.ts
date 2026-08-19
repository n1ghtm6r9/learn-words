export interface TranslationKeys {
  appTitle: string;
  navNewWords: string;
  navReview: string;
  navWords: string;
  addWordButtonLabel: string;
  settingsButtonLabel: string;

  loading: string;
  noNewWords: string;
  addWordCta: string;
  remainingWords: (count: number) => string;
  newWordsGraduated: string;
  learnedCount: (count: number) => string;
  done: string;

  noReviewsYet: string;
  goToNewWords: string;
  reviewProgress: (current: number, total: number) => string;
  reviewComplete: string;
  reviewCorrectCount: (count: number) => string;
  reviewAlmostCount: (count: number) => string;
  reviewWrongCount: (count: number) => string;

  wordInputLabel: string;
  checkAnswer: string;
  feedbackCorrect: string;
  recallFeedbackAlmost: (correct: string) => string;
  recallFeedbackWrong: (correct: string) => string;
  recognitionFeedbackAlmost: string;
  recognitionFeedbackWrong: string;
  speak: string;
  retryPrompt: string;
  retryButton: string;
  answerSaveError: string;
  phaseProgress: (current: number, total: number) => string;

  translationInputLabel: string;
  duplicateWarning: string;
  save: string;
  saveAnyway: string;
  close: string;

  wordListLabel: string;
  parseErrorPrefix: string;
  bulkSaveError: string;
  bulkDuplicatesSkipped: (count: number) => string;
  saveAll: string;
  singleWordMode: string;
  bulkMode: string;
  confirmDelete: string;
  cancel: string;

  searchPlaceholder: string;
  noWordsYet: string;
  nothingFound: string;
  editWordDialogTitle: string;
  learningBadge: string;
  newWordStepStatus: (step: number) => string;
  ratingSrLabel: string;
  phraseTag: string;
  edit: string;
  delete: string;
  deleteError: string;

  exportButtonLabel: string;
  importButtonLabel: string;
  exportDialogTitle: string;
  importDialogTitle: string;
  exportIncludeWords: string;
  exportIncludeSettings: string;
  exportConfirmButton: string;
  importConfirmButton: string;
  importFileLabel: string;
  importSummary: (words: number, hasSettings: boolean) => string;
  importSuccess: (count: number) => string;
  importUpdated: (count: number) => string;
  importSkipped: (count: number) => string;
  importSettingsApplied: string;
  importFailed: string;
  exportFailed: string;
  importError: string;

  phaseARepeatsLabel: string;
  phaseBRepeatsLabel: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  accentColorLabel: string;
  accentBlue: string;
  accentGreen: string;
  accentPurple: string;
  accentOrange: string;
  languageLabel: string;
}
