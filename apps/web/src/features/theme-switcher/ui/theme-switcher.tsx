import type { FC } from 'react';
import { useState } from 'react';

function getInitialTheme(): 'dark' | 'light' {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    try {
      const stored = localStorage.getItem('induktr-theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Storage unavailable
    }
  }
  return 'dark';
}

export const ThemeSwitcher: FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
    try {
      localStorage.setItem('induktr-theme', nextTheme);
    } catch {
      // Storage unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="px-3 py-1.5 rounded-md border border-border-subtle bg-bg-card text-text-primary text-xs cursor-pointer flex items-center gap-1.5 font-semibold hover:border-accent-cyan/40 transition-colors"
    >
      <span>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
    </button>
  );
};
