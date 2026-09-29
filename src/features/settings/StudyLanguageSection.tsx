import { SegmentedControl } from '@/components/ui/segmentedControl';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';

export function StudyLanguageSection() {
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const setStudyLanguage = useUIStore((s) => s.setStudyLanguage);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.studyLanguageLabel}
      <SegmentedControl<StudyLanguage>
        label={t.studyLanguageLabel}
        value={studyLanguage}
        onChange={setStudyLanguage}
        options={STUDY_LANGUAGES.map((language) => ({ value: language, label: STUDY_LANGUAGE_PROFILES[language].name }))}
      />
      <p className="text-sm font-normal text-muted-foreground">{t.studyLanguageHint}</p>
    </div>
  );
}
