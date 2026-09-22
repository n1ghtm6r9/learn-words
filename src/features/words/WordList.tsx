import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DndContext, MeasuringStrategy, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { AnimatePresence } from 'motion/react';
import { arrayMove } from '@dnd-kit/sortable';
import { CheckSquare, Download, Search, TriangleAlert, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDb } from '@/db/useDb';
import { isUsableWord } from '@/db/isUsableWord';
import { deleteWordsCascade } from '@/db/deleteWordsCascade';
import { restoreWords } from '@/db/restoreWords';
import { restoreWordFolders } from '@/db/restoreWordFolders';
import { appendFolder } from '@/db/appendFolder';
import { appendTag } from '@/db/appendTag';
import type { LabelColor } from '@/db/labelColor.type';
import { moveWordsToFolder } from '@/db/moveWordsToFolder';
import { moveWordToFolder } from '@/db/moveWordToFolder';
import { writeOrder } from '@/db/writeOrder';
import { addTagToWords } from '@/db/addTagToWords';
import { removeTagFromWords } from '@/db/removeTagFromWords';
import type { Word } from '@/db/word.type';
import { CARD_CLASS } from '@/lib/cardClass';
import { filterWordsByScope } from '@/lib/filterWordsByScope';
import { folderCounts } from '@/lib/folderCounts';
import { tagCounts } from '@/lib/tagCounts';
import { tagsByWord } from '@/lib/tagsByWord';
import { useOptimisticOrder } from '@/lib/useOptimisticOrder';
import { useTouchFriendlySensors } from '@/lib/useTouchFriendlySensors';
import { DragOverlayPortal } from '@/components/dnd/DragOverlayPortal';
import { UndoToast } from '@/components/ui/undoToast';
import type { UndoToastState } from '@/components/ui/undoToastState.type';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { ExportDialog } from './ExportDialog';
import { DraggableWordItem } from './DraggableWordItem';
import type { DragPayload } from './dragPayload.type';
import { FolderBar } from './FolderBar';
import { FolderChipPreview } from './FolderChipPreview';
import { folderBarCollision } from './folderBarCollision';
import { WordDragPreview } from './WordDragPreview';
import { ImportDialog } from './ImportDialog';
import { FolderTargetSheet } from './FolderTargetSheet';
import { SelectionActionBar } from './SelectionActionBar';
import { SelectionHeader } from './SelectionHeader';
import { TagTargetSheet } from './TagTargetSheet';
import { TagFilter } from './TagFilter';
import { WordDetailsDialog } from './WordDetailsDialog';
import { WordForm } from './WordForm';

export function WordList() {
  const db = useDb();
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const snapshot = useLiveQuery(
    async () => ({
      db,
      words: await db.words.toArray(),
      folders: await db.folders.orderBy('order').toArray(),
      tags: await db.tags.orderBy('order').toArray(),
      links: await db.wordTags.toArray(),
    }),
    [db],
  );
  const data = snapshot?.db === db ? snapshot : undefined;
  const words = data?.words;
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState<number | null | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selecting = useUIStore((s) => s.selectingWords);
  const setSelecting = useUIStore((s) => s.setSelectingWords);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [detailsWord, setDetailsWord] = useState<Word | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [bulkError, setBulkError] = useState(false);
  const [toast, setToast] = useState<UndoToastState | null>(null);
  const [sheet, setSheet] = useState<'move' | 'add' | 'remove' | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const t = useTranslation();

  const storedFolders = useMemo(() => data?.folders ?? [], [data?.folders]);
  const [folders, setPendingFolderOrder] = useOptimisticOrder(storedFolders);
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const sensors = useTouchFriendlySensors();
  const tags = useMemo(() => data?.tags ?? [], [data?.tags]);

  useEffect(() => {
    if (!data) return;
    if (folderFilter !== 'all' && folderFilter !== null && !folders.some((f) => f.id === folderFilter)) {
      setFolderFilter('all');
    }
    const live = tagFilter.filter((id) => tags.some((tag) => tag.id === id));
    if (live.length !== tagFilter.length) setTagFilter(live);
  }, [data, folders, tags, folderFilter, tagFilter]);

  useEffect(() => {
    setFolderFilter('all');
    setTagFilter([]);
    setSelecting(false);
    setSelectedIds([]);
  }, [db, setSelecting]);

  useEffect(() => {
    return () => {
      setSelecting(false);
    };
  }, [setSelecting]);

  useEffect(() => {
    setSelectedIds([]);
  }, [folderFilter, tagFilter]);

  const usable = useMemo(() => (words ?? []).filter(isUsableWord), [words]);
  const linksByWord = useMemo(() => tagsByWord(data?.links ?? []), [data?.links]);
  const byFolder = useMemo(() => folderCounts(usable), [usable]);
  const byTag = useMemo(() => tagCounts(usable, data?.links ?? []), [usable, data?.links]);
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id!, tag])), [tags]);
  const folderById = useMemo(() => new Map(folders.map((f) => [f.id!, f])), [folders]);

  const sorted = useMemo(
    () =>
      filterWordsByScope(usable, { folderId: folderFilter, tagIds: tagFilter }, linksByWord).sort((a, b) =>
        a.term.localeCompare(b.term, studyLanguage),
      ),
    [usable, folderFilter, tagFilter, linksByWord, studyLanguage],
  );

  const filtered = useMemo(() => {
    const query = normalizeTerm(search).toLowerCase();
    if (!query) return sorted;
    return sorted.filter(
      (w) =>
        normalizeTerm(w.term).toLowerCase().includes(query) ||
        normalizeTerm(w.translation).toLowerCase().includes(query),
    );
  }, [sorted, search]);

  const scopedTotal = useMemo(() => filterWordsByScope(usable, { folderId: 'all', tagIds: [] }, linksByWord).length, [usable, linksByWord]);

  async function moveDraggedWord(wordId: number, folderId: number | null) {
    try {
      const previous = new Map([[wordId, usable.find((word) => word.id === wordId)?.folderId]]);
      await moveWordToFolder(db, wordId, folderId);
      const folder = folders.find((f) => f.id === folderId);
      showToast(folder ? t.wordsMovedToFolder(1, folder.name) : t.wordsMovedToRoot(1), () =>
        restoreWordFolders(db, previous),
      );
      setBulkError(false);
    } catch {
      setBulkError(true);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag((event.active.data.current as DragPayload | undefined) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDrag(null);
    const dragged = active.data.current as DragPayload | undefined;
    const target = over?.data.current as DragPayload | undefined;
    if (!dragged || !target) return;

    if (dragged.type === 'word') {
      if (target.type === 'root') void moveDraggedWord(dragged.wordId, null);
      if (target.type === 'folder') void moveDraggedWord(dragged.wordId, target.folderId);
      return;
    }

    if (dragged.type === 'folder' && target.type === 'folder' && dragged.folderId !== target.folderId) {
      const ids = folders.map((folder) => folder.id!);
      const next = arrayMove(ids, ids.indexOf(dragged.folderId), ids.indexOf(target.folderId));
      setPendingFolderOrder(next);
      void writeOrder(db.folders, next);
    }
  }

  function renderDragPreview() {
    if (activeDrag?.type === 'word') {
      const word = usable.find((w) => w.id === activeDrag.wordId);
      return word ? <WordDragPreview word={word} /> : null;
    }
    if (activeDrag?.type === 'folder') {
      const folder = folderById.get(activeDrag.folderId);
      return folder ? <FolderChipPreview folder={folder} count={byFolder.get(folder.id!) ?? 0} /> : null;
    }
    return null;
  }

  const dismissToast = useCallback(() => setToast(null), []);

  function showToast(message: string, undo: (() => Promise<void>) | null) {
    setToast({
      id: Date.now(),
      message,
      undo: undo
        ? () => {
            void undo().catch(() => setBulkError(true));
          }
        : null,
    });
  }

  async function handleDelete(id?: number) {
    if (id == null) return;
    try {
      const snapshot = await deleteWordsCascade(db, [id]);
      setDeleteError(false);
      showToast(t.wordsDeleted(1), () => restoreWords(db, snapshot));
    } catch {
      setDeleteError(true);
    }
  }

  const visibleIds = useMemo(() => new Set(filtered.map((word) => word.id!)), [filtered]);
  const targets = useMemo(() => selectedIds.filter((id) => visibleIds.has(id)), [selectedIds, visibleIds]);

  const sharedFolder = useMemo(() => {
    if (targets.length === 0) return undefined;
    const folderOf = (id: number) => usable.find((word) => word.id === id)?.folderId ?? null;
    const first = folderOf(targets[0]);
    return targets.every((id) => folderOf(id) === first) ? first : undefined;
  }, [targets, usable]);

  const coverage = useMemo(() => {
    const counts = new Map<number, number>();
    for (const id of targets) {
      for (const tagId of linksByWord.get(id) ?? []) counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    }
    return counts;
  }, [targets, linksByWord]);

  function leaveSelection() {
    setSelecting(false);
    setSelectedIds([]);
    setSheet(null);
  }

  async function runBulk(action: (ids: number[]) => Promise<{ message: string; undo: () => Promise<void> }>) {
    if (targets.length === 0) return;
    try {
      const { message, undo } = await action(targets);
      setBulkError(false);
      leaveSelection();
      showToast(message, undo);
    } catch {
      setBulkError(true);
    }
  }

  function moveSelection(folderId: number | null) {
    void runBulk(async (ids) => {
      const previous = new Map(ids.map((id) => [id, usable.find((word) => word.id === id)?.folderId]));
      const moved = await moveWordsToFolder(db, ids, folderId);
      const folder = folders.find((f) => f.id === folderId);
      return {
        message: folder ? t.wordsMovedToFolder(moved, folder.name) : t.wordsMovedToRoot(moved),
        undo: () => restoreWordFolders(db, previous),
      };
    });
  }

  function tagSelection(tagId: number, tagName: string) {
    void runBulk(async (ids) => {
      const fresh = ids.filter((id) => !(linksByWord.get(id) ?? []).includes(tagId));
      const added = await addTagToWords(db, fresh, tagId);
      return {
        message: t.tagAddedToWords(added, tagName),
        undo: async () => {
          await removeTagFromWords(db, fresh, tagId);
        },
      };
    });
  }

  function untagSelection(tagId: number) {
    void runBulk(async (ids) => {
      const tagged = ids.filter((id) => (linksByWord.get(id) ?? []).includes(tagId));
      const removed = await removeTagFromWords(db, tagged, tagId);
      return {
        message: t.tagRemovedFromWords(removed, tagById.get(tagId)?.name ?? ''),
        undo: async () => {
          await addTagToWords(db, tagged, tagId);
        },
      };
    });
  }

  function deleteSelection() {
    void runBulk(async (ids) => {
      const snapshot = await deleteWordsCascade(db, ids);
      return { message: t.wordsDeleted(snapshot.words.length), undo: () => restoreWords(db, snapshot) };
    });
  }

  async function createFolderAndMove(name: string, color: LabelColor) {
    try {
      moveSelection(await appendFolder(db, name, color));
    } catch {
      setBulkError(true);
    }
  }

  async function createTagAndApply(name: string, color: LabelColor) {
    try {
      tagSelection(await appendTag(db, name, color), name);
    } catch {
      setBulkError(true);
    }
  }

  if (!words) {
    return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={folderBarCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input placeholder={t.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>

        <div className="flex flex-col gap-2">
          <FolderBar
            folders={folders}
            counts={byFolder}
            value={folderFilter}
            wordDragging={activeDrag?.type === 'word'}
            onChange={setFolderFilter}
          />

          <TagFilter
            tags={tags}
            counts={byTag}
            selected={tagFilter}
            onToggle={(tagId) =>
              setTagFilter((current) =>
                current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
              )
            }
          />
        </div>

        {deleteError && (
          <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t.deleteError}
          </p>
        )}

        {bulkError && (
          <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t.bulkActionFailed}
          </p>
        )}

        {selecting ? (
          <SelectionHeader
            count={targets.length}
            total={filtered.length}
            onToggleAll={() =>
              setSelectedIds(targets.length === filtered.length ? [] : filtered.map((word) => word.id!))
            }
            onExit={leaveSelection}
          />
        ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">
            {scopedTotal === 0
              ? ''
              : filtered.length === scopedTotal
                ? t.wordsTotal(scopedTotal)
                : t.wordsFiltered(filtered.length, scopedTotal)}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {!selecting && filtered.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setSelecting(true)}>
                <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {t.selectWords}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t.exportButtonLabel}
              title={t.exportButtonLabel}
              onClick={() => setExportOpen(true)}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t.importButtonLabel}
              title={t.importButtonLabel}
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {scopedTotal === 0 && search === '' ? t.noWordsYet : t.nothingFound}
          </p>
        ) : (
          <ul className={cn(CARD_CLASS, 'divide-y divide-border/70 overflow-hidden')}>
            {filtered.map((word) => (
              <DraggableWordItem
                key={word.id}
                word={word}
                folder={word.folderId == null ? undefined : folderById.get(word.folderId)}
                tags={(linksByWord.get(word.id!) ?? []).map((id) => tagById.get(id)).filter((tag) => tag != null)}
                selectable={selecting}
                selected={selectedIds.includes(word.id!)}
                onToggleSelected={() =>
                  setSelectedIds((current) =>
                    current.includes(word.id!) ? current.filter((id) => id !== word.id) : [...current, word.id!],
                  )
                }
                onEdit={() => setEditingWord(word)}
                onDelete={() => void handleDelete(word.id)}
                onOpenDetails={() => setDetailsWord(word)}
              />
            ))}
          </ul>
        )}

        {selecting && <div className="h-24" aria-hidden="true" />}

        <AnimatePresence>
          {selecting && (
            <SelectionActionBar
              disabled={targets.length === 0}
              onMove={() => setSheet('move')}
              onAddTag={() => setSheet('add')}
              onRemoveTag={() => setSheet('remove')}
              onDelete={deleteSelection}
            />
          )}
        </AnimatePresence>

        <FolderTargetSheet
          open={sheet === 'move'}
          onOpenChange={(open) => !open && setSheet(null)}
          folders={folders}
          counts={byFolder}
          sharedFolder={sharedFolder}
          onPick={moveSelection}
          onCreate={(name, color) => void createFolderAndMove(name, color)}
        />

        <TagTargetSheet
          mode={sheet === 'remove' ? 'remove' : 'add'}
          open={sheet === 'add' || sheet === 'remove'}
          onOpenChange={(open) => !open && setSheet(null)}
          tags={tags}
          coverage={coverage}
          selectedCount={targets.length}
          onPick={(tagId) =>
            sheet === 'remove' ? untagSelection(tagId) : tagSelection(tagId, tagById.get(tagId)?.name ?? '')
          }
          onCreate={(name, color) => void createTagAndApply(name, color)}
        />

        <UndoToast toast={toast} undoLabel={t.undo} lifted={selecting} onDismiss={dismissToast} />

        <Dialog open={editingWord != null} onOpenChange={(open) => !open && setEditingWord(null)}>
          <DialogContent>
            <DialogTitle>{t.editWordDialogTitle}</DialogTitle>
            {editingWord && (
              <WordForm mode="edit" word={editingWord} onDone={() => setEditingWord(null)} />
            )}
          </DialogContent>
        </Dialog>

        <WordDetailsDialog
          word={detailsWord}
          folder={detailsWord?.folderId == null ? undefined : folderById.get(detailsWord.folderId)}
          tagNames={(linksByWord.get(detailsWord?.id ?? -1) ?? []).map((id) => tagById.get(id)?.name ?? '')}
          onOpenChange={(open) => !open && setDetailsWord(null)}
        />

        <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </div>
      <DragOverlayPortal>{renderDragPreview()}</DragOverlayPortal>
    </DndContext>
  );
}
