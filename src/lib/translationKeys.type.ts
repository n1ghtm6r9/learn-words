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
  goHome: string;

  wordInputLabel: string;
  checkAnswer: string;
  feedbackCorrect: string;
  recallFeedbackAlmost: (correct: string) => string;
  recallFeedbackWrong: (correct: string) => string;
  recognitionFeedbackAlmost: string;
  recognitionFeedbackWrong: string;
  speak: string;
  next: string;

  translationInputLabel: string;
  duplicateWarning: string;
  save: string;

  wordListLabel: string;
  parseErrorPrefix: string;
  bulkSaveError: string;
  saveAll: string;
  singleWordMode: string;
  bulkMode: string;

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
