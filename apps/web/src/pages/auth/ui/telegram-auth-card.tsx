import { type FC, useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { graphqlClient } from '@/shared/api/graphql-client';
import { GENERATE_DEV_TELEGRAM_INIT_DATA_QUERY } from '@/shared/api/operations';
import {
  TelegramHandshakeSchema,
  type TelegramHandshakeInput,
} from '../model/auth-schema';

interface TelegramAuthCardProps {
  readonly isLoading: boolean;
  readonly onAuthenticate: (customInitData?: string) => void;
}

export const TelegramAuthCard: FC<TelegramAuthCardProps> = ({
  isLoading,
  onAuthenticate,
}) => {
  const [isTelegramEnv] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return Boolean(tg?.initData && tg.initData.length > 0);
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<TelegramHandshakeInput>({
    resolver: zodResolver(TelegramHandshakeSchema),
    defaultValues: {
      firstName: 'Nikita',
      username: 'Induktr',
      telegramId: '5735264261',
      initData: '',
    },
    mode: 'onChange',
  });

  const watchedInitData = useWatch({ control, name: 'initData' });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateHandshake = useCallback(async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const values = getValues();
      const res = await graphqlClient
        .query(GENERATE_DEV_TELEGRAM_INIT_DATA_QUERY, {
          userId: values.telegramId?.trim() || '5735264261',
          username: values.username?.trim() || 'Induktr',
          firstName: values.firstName?.trim() || 'Nikita',
        })
        .toPromise();

      if (res.error) {
        setGenError(res.error.message);
      } else if (res.data?.generateDevTelegramInitData) {
        setValue('initData', res.data.generateDevTelegramInitData, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Failed to reach API server');
    } finally {
      setIsGenerating(false);
    }
  }, [getValues, setValue]);

  const handleCopy = useCallback(() => {
    if (watchedInitData && typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(watchedInitData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [watchedInitData]);

  const onSubmit = useCallback(
    (data: TelegramHandshakeInput) => {
      onAuthenticate(data.initData.trim() || undefined);
    },
    [onAuthenticate],
  );

  const handleNativeOrDevClick = useCallback(async () => {
    if (isTelegramEnv) {
      onAuthenticate();
      return;
    }

    if (!watchedInitData) {
      await handleGenerateHandshake();
    }
    await handleSubmit(onSubmit)();
  }, [handleGenerateHandshake, handleSubmit, isTelegramEnv, onAuthenticate, onSubmit, watchedInitData]);

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Card */}
      <div className="p-5 rounded-md bg-bg-surface border border-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-accent-cyan text-lg">✈</span>
            <span className="font-extrabold text-[0.95rem] text-text-primary">
              Cryptographic initData Handshake
            </span>
          </div>
          {isTelegramEnv ? (
            <span className="mono text-[0.68rem] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MINI APP RUNTIME
            </span>
          ) : (
            <span className="mono text-[0.68rem] px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/35 text-accent-cyan font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
              DEV / BROWSER RUNTIME
            </span>
          )}
        </div>

        <p className="m-0 text-[0.85rem] text-text-secondary leading-normal">
          Authenticates via SHA-256 HMAC signature verification against the official Telegram bot token.
          In a standalone web browser, you can generate a cryptographically valid dev handshake or paste
          your raw Telegram WebApp string.
        </p>
      </div>

      {/* Standalone Browser Dev Handshake Workbench */}
      {!isTelegramEnv && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 rounded-md bg-bg-base/80 border border-sky-500/20 flex flex-col gap-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="mono text-xs text-accent-cyan font-semibold tracking-wide flex items-center gap-1.5">
              <span>⚡</span> DEV HANDSHAKE GENERATOR &amp; PAYLOAD WORKBENCH
            </div>
            <button
              type="button"
              disabled={isGenerating || isLoading}
              onClick={() => void handleGenerateHandshake()}
              className="mono text-[0.72rem] px-3 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-accent-cyan hover:bg-sky-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? 'SIGNING...' : '↻ GENERATE FRESH HMAC'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="dev-first-name"
                className="mono flex justify-between text-[0.68rem] text-text-tertiary mb-1"
              >
                <span>FIRST NAME</span>
                {errors.firstName && (
                  <span className="text-accent-danger text-[0.65rem] truncate max-w-[120px]">
                    {errors.firstName.message}
                  </span>
                )}
              </label>
              <input
                id="dev-first-name"
                type="text"
                {...register('firstName')}
                className={`w-full bg-bg-surface border rounded px-2.5 py-1.5 text-xs text-text-primary mono focus:outline-none ${
                  errors.firstName
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-border-subtle focus:border-accent-cyan'
                }`}
                placeholder="Nikita"
              />
            </div>
            <div>
              <label
                htmlFor="dev-username"
                className="mono flex justify-between text-[0.68rem] text-text-tertiary mb-1"
              >
                <span>USERNAME</span>
                {errors.username && (
                  <span className="text-accent-danger text-[0.65rem] truncate max-w-[120px]">
                    {errors.username.message}
                  </span>
                )}
              </label>
              <input
                id="dev-username"
                type="text"
                {...register('username')}
                className={`w-full bg-bg-surface border rounded px-2.5 py-1.5 text-xs text-text-primary mono focus:outline-none ${
                  errors.username
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-border-subtle focus:border-accent-cyan'
                }`}
                placeholder="Induktr"
              />
            </div>
            <div>
              <label
                htmlFor="dev-user-id"
                className="mono flex justify-between text-[0.68rem] text-text-tertiary mb-1"
              >
                <span>TELEGRAM ID</span>
                {errors.telegramId && (
                  <span className="text-accent-danger text-[0.65rem] truncate max-w-[120px]">
                    {errors.telegramId.message}
                  </span>
                )}
              </label>
              <input
                id="dev-user-id"
                type="text"
                {...register('telegramId')}
                className={`w-full bg-bg-surface border rounded px-2.5 py-1.5 text-xs text-text-primary mono focus:outline-none ${
                  errors.telegramId
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-border-subtle focus:border-accent-cyan'
                }`}
                placeholder="5735264261"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="init-data-textarea"
                className="mono text-[0.68rem] text-text-tertiary"
              >
                RAW initData STRING (URL-ENCODED QUERY)
              </label>
              <div className="flex items-center gap-3">
                {errors.initData && (
                  <span className="mono text-accent-danger text-[0.65rem]">
                    {errors.initData.message}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!watchedInitData}
                  className="mono text-[0.68rem] text-accent-cyan hover:underline cursor-pointer disabled:opacity-40"
                >
                  {copied ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
            <textarea
              id="init-data-textarea"
              rows={3}
              {...register('initData')}
              className={`w-full bg-bg-surface border rounded p-2 text-[0.72rem] text-text-secondary mono focus:outline-none resize-none leading-relaxed ${
                errors.initData
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border-subtle focus:border-accent-cyan'
              }`}
              placeholder="user=%7B%22id%22%3A...%7D&auth_date=...&hash=... (Click '↻ GENERATE FRESH HMAC' to populate)"
            />
          </div>

          {genError && (
            <div className="mono text-[0.7rem] text-accent-danger bg-red-500/10 border border-red-500/30 p-2 rounded">
              Handshake error: {genError}
            </div>
          )}
        </form>
      )}

      {/* Main Submit Action Button */}
      <button
        type="button"
        disabled={isLoading || isGenerating}
        onClick={() => void handleNativeOrDevClick()}
        className="mono flex items-center justify-center gap-2 p-3.5 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-[0.9rem] shadow-[0_4px_18px_rgba(38,181,244,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading
          ? 'VERIFYING TELEGRAM SIGNATURE...'
          : isGenerating
            ? 'COMPUTING SIGNATURE...'
            : isTelegramEnv
              ? 'AUTHENTICATE VIA TELEGRAM ✈'
              : 'AUTHENTICATE WITH SIGNED HANDSHAKE ✈'}
      </button>
    </div>
  );
};
