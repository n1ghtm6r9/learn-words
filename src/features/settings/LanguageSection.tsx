import { SegmentedControl } from '@/components/ui/segmentedControl';
import { TRANSLATIONS } from '@/i18n/translations';
import type { UiLanguage } from '@/i18n/uiLanguage.type';
import { UI_LANGUAGES } from '@/i18n/uiLanguages';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';

export function LanguageSection() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.languageLabel}
      <SegmentedControl<UiLanguage>
        label={t.languageLabel}
        value={language}
        onChange={setLanguage}
        options={UI_LANGUAGES.map((uiLanguage) => ({ value: uiLanguage, label: TRANSLATIONS[uiLanguage].languageName }))}
      />
    </div>
  );
}
