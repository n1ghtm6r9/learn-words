import type { WordStage } from './wordStage.type';
import type { LearningPhase } from './learningPhase.type';
import type { WordKind } from './wordKind.type';

export interface Word {
  id?: string;
  term: string;
  translation: string;
  createdAt: number;
  kind: WordKind;

  stage: WordStage;

  learningPhase: LearningPhase;
  phaseStreak: number;

  stability: number;
  difficulty: number;
  reviewStreak: number;

  lastReviewedAt?: number;

  folderId?: string;
}
