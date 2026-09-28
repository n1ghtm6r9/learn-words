export type DragPayload =
  | { type: 'word'; wordId: string }
  | { type: 'folder'; folderId: string }
  | { type: 'root' };
