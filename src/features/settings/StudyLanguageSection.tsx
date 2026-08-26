import { Button } from '@/components/ui/button';
import { STUDY_LANGUAGE_NAMES } from '@/lib/studyLanguageNames';
import { useTranslation } from '@/lib/useTranslation';
import type { StudyLanguage } from '@/store/studyLanguage.type';
import { useUIStore } from '@/store/useUIStore';

const STUDY_LANGUAGES = Object.keys(STUDY_LANGUAGE_NAMES) as StudyLanguage[];

export function StudyLanguageSection() {
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const setStudyLanguage = useUIStore((s) => s.setStudyLanguage);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {t.studyLanguageLabel}
      <div role="group" aria-label={t.studyLanguageLabel} className="flex gap-2">
        {STUDY_LANGUAGES.map((language) => (
          <Button
            key={language}
            type="button"
            variant={studyLanguage === language ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStudyLanguage(language)}
          >
            {STUDY_LANGUAGE_NAMES[language]}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t.studyLanguageHint}</p>
    </div>
  );
}
