import type { FC } from 'react';
import type { AuthMethod } from '@/app/store/auth-slice';

interface AuthMethodSwitcherProps {
  readonly currentMethod: AuthMethod;
  readonly onSelectMethod: (method: AuthMethod) => void;
}

const METHODS: readonly { id: AuthMethod; label: string }[] = [
  { id: 'telegram', label: 'Telegram HMAC' },
  { id: 'verify-db', label: 'DB Lookup' },
  { id: 'demo', label: 'Founder Demo' },
  { id: 'token', label: 'Bearer Token' },
];

export const AuthMethodSwitcher: FC<AuthMethodSwitcherProps> = ({
  currentMethod,
  onSelectMethod,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-bg-surface p-1 rounded-md border border-border-subtle">
      {METHODS.map((method) => {
        const isActive = currentMethod === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelectMethod(method.id)}
            className={`mono py-2 px-2 rounded border-0 font-bold text-xs cursor-pointer transition-colors text-center ${
              isActive
                ? 'bg-accent-cyan-solid text-[#071018] shadow-[0_2px_8px_rgba(38,181,244,0.3)]'
                : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            {method.label}
          </button>
        );
      })}
    </div>
  );
};
