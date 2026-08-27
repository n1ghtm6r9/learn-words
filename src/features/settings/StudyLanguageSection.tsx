import { Button } from '@/components/ui/button';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';

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
            {STUDY_LANGUAGE_PROFILES[language].name}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t.studyLanguageHint}</p>
    </div>
  );
}
