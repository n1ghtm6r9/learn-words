export interface UndoToastState {
  id: number;
  message: string;
  undo: (() => void) | null;
}
