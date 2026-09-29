import { useEffect, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { NavBar } from '@/components/layout/NavBar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NewWordsSession } from '@/features/newWords/NewWordsSession';
import { ReviewSession } from '@/features/review/ReviewSession';
import { AddWordDialog } from '@/features/words/AddWordDialog';
import { WordList } from '@/features/words/WordList';
import { FoldersDialog } from '@/features/organize/FoldersDialog';
import { TagsDialog } from '@/features/organize/TagsDialog';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { LoginDialog } from '@/features/settings/login/LoginDialog';
import { getCloud } from '@/cloud/getCloud';
import { useUIStore } from '@/store/useUIStore';
import { applyAccentColor } from '@/lib/applyAccentColor';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { useTranslation } from '@/i18n/useTranslation';

function App() {
  const screen = useUIStore((s) => s.screen);
  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const accentColor = useUIStore((s) => s.accentColor);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const selectingWords = useUIStore((s) => s.selectingWords);
  const foldersOpen = useUIStore((s) => s.foldersOpen);
  const setFoldersOpen = useUIStore((s) => s.setFoldersOpen);
  const tagsOpen = useUIStore((s) => s.tagsOpen);
  const setTagsOpen = useUIStore((s) => s.setTagsOpen);
  const t = useTranslation();
  const cloud = getCloud();

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useLayoutEffect(() => {
    applyAccentColor(accentColor, theme);
  }, [accentColor, theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-[calc(6rem+var(--safe-bottom))] text-foreground md:pb-0 md:pl-64">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl md:fixed md:top-0 md:left-0 md:z-40 md:w-64 md:border-b-0 md:bg-transparent md:pt-5 md:pb-2 md:backdrop-blur-none">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-mono text-lg font-semibold tracking-tight">{t.appTitle}</h1>
          <span
            role="img"
            aria-label={`${t.studyLanguageLabel}: ${STUDY_LANGUAGE_PROFILES[studyLanguage].name}`}
            className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-primary uppercase"
          >
            {studyLanguage}
          </span>
        </div>
        <button
          type="button"
          aria-label={t.settingsButtonLabel}
          onClick={() => setSettingsOpen(true)}
          className="flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
        >
          <SettingsIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 pb-4 md:max-w-3xl md:px-8 md:pt-8 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col"
          >
            {screen === 'newWords' && <NewWordsSession key={studyLanguage} />}
            {screen === 'review' && <ReviewSession key={studyLanguage} />}
            {screen === 'words' && <WordList />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!selectingWords && (
        <motion.button
          type="button"
          aria-label={t.addWordButtonLabel}
          whileTap={{ scale: 0.92 }}
          onClick={() => setAddWordOpen(true)}
          className="fixed right-4 bottom-[calc(6.25rem+var(--safe-bottom))] z-20 flex h-16 w-16 items-center justify-center gap-2 rounded-[1.4rem] bg-primary text-primary-foreground shadow-xl shadow-primary/35 transition-colors hover:bg-primary/90 md:right-8 md:bottom-8 md:h-12 md:w-auto md:rounded-xl md:px-5 md:text-sm md:font-medium"
        >
          <Plus className="h-7 w-7 md:h-5 md:w-5" strokeWidth={2.4} aria-hidden="true" />
          <span className="hidden md:inline">{t.addWordCta}</span>
        </motion.button>
      )}

      <Dialog open={addWordOpen} onOpenChange={setAddWordOpen}>
        <DialogContent>
          <DialogTitle>{t.addWordButtonLabel}</DialogTitle>
          <AddWordDialog
            onDone={() => {
              setAddWordOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogTitle>{t.settingsButtonLabel}</DialogTitle>
          <SettingsPage />
        </DialogContent>
      </Dialog>

      <FoldersDialog open={foldersOpen} onOpenChange={setFoldersOpen} />
      <TagsDialog open={tagsOpen} onOpenChange={setTagsOpen} />
      {cloud && <LoginDialog cloud={cloud} />}

      <NavBar />
    </div>
  );
}

export default App;
