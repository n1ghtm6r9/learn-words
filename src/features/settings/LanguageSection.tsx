import { Button } from '@/components/ui/button';
import { TRANSLATIONS } from '@/i18n/translations';
import { UI_LANGUAGES } from '@/i18n/uiLanguages';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';

export function LanguageSection() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {t.languageLabel}
      <div role="group" aria-label={t.languageLabel} className="flex gap-2">
        {UI_LANGUAGES.map((uiLanguage) => (
          <Button
            key={uiLanguage}
            type="button"
            variant={language === uiLanguage ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage(uiLanguage)}
          >
            {TRANSLATIONS[uiLanguage].languageName}
          </Button>
        ))}
      </div>
    </div>
  );
}
