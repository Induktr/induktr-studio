import type { FC } from 'react';
import { ThemeSwitcher } from '@/features/theme-switcher';
import { LocaleSwitcher, useTranslation } from '@/shared/i18n';

interface HeaderProps {
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
  readonly onInitializeClick?: () => void;
  readonly userVerified?: boolean;
  readonly username?: string;
  readonly activeLeadSlug?: string | null;
}

export const Header: FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onInitializeClick,
  userVerified = false,
  username = 'STUDIO CLIENT',
  activeLeadSlug,
}) => {
  const { t } = useTranslation();

  return (
    <header className="px-8 py-3.5 border-b border-border-subtle flex justify-between items-center bg-bg-glass backdrop-blur-md sticky top-0 z-50">
      {/* Brand Logo */}
      <button
        type="button"
        aria-label="Induktr Studio Home"
        onClick={() => onTabChange('studio')}
        className="flex items-center gap-2.5 cursor-pointer select-none bg-transparent border-0 p-0 text-inherit text-start hover:opacity-90 transition-opacity"
      >
        <svg width="26" height="24" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 5.5L8.5 2L13 5.5V20.5L8.5 24L3 20.5V5.5Z"
            stroke="var(--accent-cyan)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M15 5.5L20.5 2L25 5.5V20.5L20.5 24L15 20.5V5.5Z"
            stroke="var(--accent-cyan)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold tracking-tight text-text-primary">
            induktr
          </span>
          <span className="mono text-[0.7rem] text-text-tertiary tracking-wider font-medium">
            STUDIO / 2.0
          </span>
        </div>
      </button>

      {/* Center Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-8">
        {[
          { id: 'studio', label: t('nav.studio') },
          { id: 'store', label: t('nav.store') || 'Store' },
          { id: 'cases', label: t('nav.cases') || 'Cases' },
          { id: 'systems', label: t('nav.systems') },
          { id: 'client-hub', label: t('nav.clientHub') },
        ].map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'store' && activeTab === 'knowledge');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`bg-transparent border-0 text-sm cursor-pointer py-1 relative transition-colors ${
                isActive ? 'text-accent-cyan font-semibold' : 'text-text-secondary font-medium hover:text-text-primary'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute -bottom-1 inset-inline-start-0 inset-inline-end-0 h-[2px] bg-accent-cyan rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Telemetry Pill, Locale Switcher, Action Button & Theme */}
      <div className="flex items-center gap-3">
        {activeLeadSlug && (
          <button
            type="button"
            onClick={() => onTabChange('intake')}
            className="mono flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/30 text-accent-cyan text-xs font-bold cursor-pointer hover:bg-sky-400/20 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_var(--accent-cyan)]" />
            ORDER: {activeLeadSlug}
          </button>
        )}

        <button
          type="button"
          aria-label={userVerified ? `${username} / ${t('nav.verified')}` : t('nav.authRequired')}
          onClick={() => onTabChange(userVerified ? 'client-hub' : 'auth')}
          className={`mono hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-normal cursor-pointer transition-all hover:opacity-85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-cyan ${
            userVerified
              ? 'bg-green-500/10 border border-green-500/20 text-accent-green hover:bg-green-500/20'
              : 'bg-sky-500/10 border border-sky-500/20 text-accent-cyan hover:bg-sky-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              userVerified
                ? 'bg-accent-green shadow-[0_0_6px_var(--accent-green)]'
                : 'bg-accent-cyan shadow-[0_0_6px_var(--accent-cyan)]'
            }`}
          />
          {userVerified ? `${username} / ${t('nav.verified')}` : t('nav.authRequired')}
        </button>

        <button
          type="button"
          onClick={onInitializeClick}
          className={`mono flex items-center gap-1.5 px-4 py-2 rounded-md bg-bg-card text-xs font-bold tracking-wider cursor-pointer transition-all hover:border-accent-cyan hover:text-accent-cyan ${
            activeLeadSlug ? 'text-accent-cyan border border-sky-400/40' : 'text-text-primary border border-border-card'
          }`}
        >
          {activeLeadSlug ? t('nav.activeIntake') : t('nav.initialize')}
          <span className="text-sm icon-directional">↗</span>
        </button>

        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
};
