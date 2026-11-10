import type { FC } from 'react';
import { useAuthOrchestrator } from '../model/use-auth-orchestrator';
import { AuthMethodSwitcher } from './auth-method-switcher';
import { TelegramAuthCard } from './telegram-auth-card';
import { DbVerificationCard } from './db-verification-card';
import { FounderGatewayCard } from './founder-gateway-card';
import { BearerTokenCard } from './bearer-token-card';
import { DbExistenceBanner } from './db-existence-banner';

export interface AuthPageProps {
  readonly onSuccess?: () => void;
  readonly onSuccessUserExists?: () => void;
  readonly onSuccessUserNotFound?: () => void;
}

export const AuthPage: FC<AuthPageProps> = ({
  onSuccess,
  onSuccessUserExists,
  onSuccessUserNotFound,
}) => {
  const {
    isLoading,
    errorMessage,
    authMethod,
    userExistsInDb,
    verifiedIdentifier,
    handleTelegramAuth,
    handleVerifyDbUser,
    handleDemoVerifiedAuth,
    handleDemoUnregisteredAuth,
    handleTokenSubmit,
    handleSelectMethod,
  } = useAuthOrchestrator({
    onSuccessUserExists: () => {
      onSuccessUserExists?.();
      onSuccess?.();
    },
    onSuccessUserNotFound,
  });

  return (
    <div className="max-w-[560px] mx-auto flex flex-col gap-8 py-4">
      {/* Header */}
      <div>
        <div className="mono text-xs text-accent-cyan tracking-wider font-semibold mb-1.5">
          05 / IDENTITY VERIFICATION &amp; SECURE GATEWAY
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-text-primary">
          Establish Sovereign Session
        </h2>
        <p className="text-text-secondary text-[0.95rem] m-0 leading-normal">
          Cryptographic zero-trust verification via Telegram Mini App, Database Identity Lookup, or Sovereign Key.
        </p>
      </div>

      {/* Main Container */}
      <div className="card-layer glow-cyan p-8 flex flex-col gap-6 border border-sky-400/30">
        {/* Dynamic Database Existence Status Indicator */}
        <DbExistenceBanner
          userExistsInDb={userExistsInDb}
          identifier={verifiedIdentifier}
          isLoading={isLoading}
        />

        {/* Auth Method Switcher */}
        <AuthMethodSwitcher
          currentMethod={authMethod}
          onSelectMethod={handleSelectMethod}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mono px-4 py-3 rounded-md bg-red-500/12 border border-red-500/35 text-accent-danger text-[0.8rem]">
            Authentication error: {errorMessage}
          </div>
        )}

        {/* Tab 1: Telegram WebApp HMAC */}
        {authMethod === 'telegram' && (
          <TelegramAuthCard
            isLoading={isLoading}
            onAuthenticate={handleTelegramAuth}
          />
        )}

        {/* Tab 2: PostgreSQL Database Identity Verification */}
        {authMethod === 'verify-db' && (
          <DbVerificationCard
            isLoading={isLoading}
            onVerify={handleVerifyDbUser}
            onSimulateUnregistered={handleDemoUnregisteredAuth}
          />
        )}

        {/* Tab 3: Instant Founder / Demo Gateway */}
        {authMethod === 'demo' && (
          <FounderGatewayCard
            isLoading={isLoading}
            onVerifiedClick={handleDemoVerifiedAuth}
            onUnregisteredClick={handleDemoUnregisteredAuth}
          />
        )}

        {/* Tab 4: Direct Bearer Token Form */}
        {authMethod === 'token' && (
          <BearerTokenCard
            isLoading={isLoading}
            onSubmit={handleTokenSubmit}
          />
        )}

        {/* Security Specs Footer */}
        <div className="mono text-[0.68rem] text-text-tertiary tracking-normal border-t border-border-subtle pt-3.5 flex justify-between">
          <span>HMAC-SHA256 • ZERO PASSWORD</span>
          <span>EXPIRATION: 30 DAYS</span>
        </div>
      </div>
    </div>
  );
};
