import type { FC } from 'react';
import type { SupportedLocale } from '../types';
import { useLocale } from '../use-translation';

interface LocaleOption {
  readonly id: SupportedLocale;
  readonly label: string;
  readonly nativeLabel: string;
}

const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { id: 'en', label: 'EN', nativeLabel: 'English' },
  { id: 'ua', label: 'UA', nativeLabel: 'Українська' },
  { id: 'de', label: 'DE', nativeLabel: 'Deutsch' },
  { id: 'ar', label: 'AR', nativeLabel: 'العربية' },
  { id: 'es', label: 'ES', nativeLabel: 'Español' },
];

export const LocaleSwitcher: FC = () => {
  const { locale: currentLocale, isLoading, switchLocale } = useLocale();

  return (
    <nav
      aria-label="Language selection"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-bg-surface border border-border-subtle"
    >
      {LOCALE_OPTIONS.map((item) => {
        const isActive = currentLocale === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={isLoading && !isActive}
            aria-pressed={isActive}
            title={item.nativeLabel}
            onClick={() => switchLocale(item.id)}
            className={`mono px-2 py-1 rounded text-[0.7rem] font-bold border-0 cursor-pointer transition-all ${
              isActive
                ? 'bg-accent-cyan-solid text-[#071018] shadow-[0_1px_6px_rgba(38,181,244,0.35)]'
                : 'bg-transparent text-text-tertiary hover:text-text-primary hover:bg-white/5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
