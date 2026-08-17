import type { Word } from '../db/word.type';

export interface StudySessionState {
  queue: Word[];
  index: number;
  correct: number;
  almost: number;
  wrong: number;
}
