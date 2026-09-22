export type DragPayload =
  | { type: 'word'; wordId: number }
  | { type: 'folder'; folderId: number }
  | { type: 'root' };
