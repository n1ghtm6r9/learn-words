export interface Word {
  id?: number;
  term: string;
  translation: string;
  createdAt: number;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  dueDate: number;
  lastReviewedAt?: number;
}
