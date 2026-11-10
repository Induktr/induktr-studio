import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Bot } from 'grammy';
import { BOT_COMMANDS } from './telegram.service';

/**
 * Robustly load TELEGRAM_BOT_TOKEN from process.env or .env files.
 */
function getBotToken(): string | undefined {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  const candidatePaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(import.meta.dirname, '../../../.env'),
    resolve(import.meta.dirname, '../../../../.env'),
  ];

  for (const envPath of candidatePaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf8');
      const match = content.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  return undefined;
}

export async function runSyncBot(): Promise<void> {
  const token = getBotToken();

  if (!token) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: 'TELEGRAM_BOT_TOKEN is not configured in environment or .env file',
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const menuButtonPayload = {
    type: 'web_app',
    text: 'Studio ⚡',
    web_app: {
      url: 'https://induktr-portfolio.vercel.app/',
    },
  } as const;

  try {
    const bot = new Bot(token);

    // Tests bot.api.getMe() with 15s timeout
    const timeoutSignal = AbortSignal.timeout(15000);
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Telegram API getMe timed out after 15s'));
      }, 15000);
      if (typeof timer === 'object' && 'unref' in timer) {
        timer.unref();
      }
    });

    const me = await Promise.race([
      bot.api.getMe(
        timeoutSignal as unknown as Parameters<typeof bot.api.getMe>[0],
      ),
      timeoutPromise,
    ]);

    // Calls setMyCommands([...BOT_COMMANDS])
    await bot.api.setMyCommands([...BOT_COMMANDS]);

    // Calls setChatMenuButton
    await bot.api.setChatMenuButton({
      menu_button: menuButtonPayload,
    });

    const report = {
      ok: true,
      bot: me,
      commands: BOT_COMMANDS.length,
      menuButton: menuButtonPayload,
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

// Auto-run when executed as script
if (import.meta.main || process.argv[1]?.includes('sync-bot')) {
  void runSyncBot();
}
