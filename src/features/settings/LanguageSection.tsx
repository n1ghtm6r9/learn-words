import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';

export function LanguageSection() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {t.languageLabel}
      <div className="flex gap-2">
        <Button type="button" variant={language === 'ru' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('ru')}>
          Русский
        </Button>
        <Button type="button" variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')}>
          English
        </Button>
      </div>
    </div>
  );
}
