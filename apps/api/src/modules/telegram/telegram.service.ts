import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';

/** ────────────────────────────────────────────────────────────────
 *  Induktr Studio v2.0 — Telegram Bot Service (GrammY)
 *  ────────────────────────────────────────────────────────────── */

/** The WebApp URL dispatched via inline keyboard buttons & menu. */
export const WEBAPP_URL = 'https://induktr-portfolio.vercel.app';

/** Canonical command matrix registered on startup via Bot API. */
export const BOT_COMMANDS = [
  { command: 'start', description: 'Studio ⚡ — Welcome & quick launch' },
  { command: 'app', description: 'Open Induktr Studio Mini App' },
  { command: 'catalog', description: 'Browse digital products' },
  { command: 'status', description: 'Check lead / order status by ID' },
  { command: 'assets', description: 'Your purchased digital assets' },
  { command: 'intake', description: 'Start discovery protocol' },
  { command: 'support', description: 'Contact the engineering team' },
  { command: 'help', description: 'All commands & documentation' },
] as const;

export interface TelegramLeadNotification {
  id: string;
  name: string;
  contact: string;
  budget: string;
  description: string;
  serviceType: string;
  referrer?: string;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  readonly bot: Bot | undefined;
  private readonly chatId: string | undefined;
  private isPolling = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.config.get<string>('TELEGRAM_CHAT_ID');

    if (token) {
      this.bot = new Bot(token);
      this.registerHandlers();
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not configured. Bot disabled.');
    }
  }

  get isPollingActive(): boolean {
    return this.isPolling;
  }

  /* ──────── Lifecycle ──────── */

  /**
   * Synchronize bot commands and persistent chat menu button with exponential backoff.
   * Retries up to maxRetries times with 1s, 2s, 4s, 8s backoff on network errors/504 timeouts.
   */
  async syncBotMetadata(maxRetries = 5, initialDelayMs = 1000): Promise<void> {
    if (!this.bot) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Register canonical command matrix via Bot API
        await this.bot.api.setMyCommands([...BOT_COMMANDS]);

        // Set persistent Mini App menu button
        await this.bot.api.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: 'Studio ⚡',
            web_app: { url: WEBAPP_URL },
          },
        });

        const me = await this.bot.api.getMe();
        this.logger.log(
          `Telegram bot @${me.username} initialized. Commands: ${BOT_COMMANDS.length}, MenuButton: web_app`,
        );
        return;
      } catch (err) {
        this.logger.warn(
          `Failed to sync Telegram bot metadata (attempt ${attempt}/${maxRetries}): ${err instanceof Error ? err.message : String(err)}`,
        );

        if (attempt >= maxRetries) {
          this.logger.error(
            `Failed to sync Telegram bot metadata after ${maxRetries} attempts:`,
            err,
          );
          return;
        }

        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.bot) return;

    await this.syncBotMetadata();

    const mode =
      this.config.get<string>('TELEGRAM_MODE') ||
      (process.env.NODE_ENV === 'production' ? 'webhook' : 'polling');

    if (mode === 'polling') {
      try {
        await this.bot.api
          .deleteWebhook({ drop_pending_updates: false })
          .catch((err) => {
            this.logger.warn(
              `Failed to delete webhook before starting polling: ${err instanceof Error ? err.message : String(err)}`,
            );
          });

        this.isPolling = true;
        this.bot
          .start({
            onStart: (info) => {
              this.logger.log(
                `Telegram bot @${info.username} started in long-polling mode.`,
              );
            },
          })
          .catch((err) => {
            this.isPolling = false;
            this.logger.error('Telegram bot polling stopped with error:', err);
          });
      } catch (err) {
        this.logger.error('Failed to initiate long polling for Telegram bot:', err);
      }
    } else {
      this.logger.log('Telegram bot running in webhook mode.');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot && this.isPolling) {
      this.isPolling = false;
      try {
        await this.bot.stop();
        this.logger.log('Telegram bot polling stopped cleanly.');
      } catch (err) {
        this.logger.error('Failed to stop Telegram bot polling cleanly:', err);
      }
    }
  }

  /* ──────── Command Handlers (registered once) ──────── */

  private registerHandlers(): void {
    if (!this.bot) return;

    this.bot.command('start', async (ctx) => {
      const firstName = ctx.from?.first_name ?? 'Client';
      const kb = new InlineKeyboard()
        .webApp('Open Studio ⚡', WEBAPP_URL)
        .row()
        .text('📦 Catalog', 'cmd:catalog')
        .text('🔍 Status', 'cmd:status_prompt')
        .row()
        .text('📋 My Assets', 'cmd:assets')
        .text('📞 Support', 'cmd:support');

      await ctx.reply(
        [
          `⚡ <b>Welcome to Induktr Studio v2.0, ${this.escapeHtml(firstName)}!</b>`,
          '',
          '🔬 <b>Digital Lab & High-Performance Architecture</b>',
          '',
          '• Modular UI Kits & Engineering Cheatsheets',
          '• Full-Cycle Web Development & System Design',
          '• Consultation & Architecture Audits',
          '',
          '🌐 <a href="https://induktr-portfolio.vercel.app">induktr-portfolio.vercel.app</a>',
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: kb },
      );
    });

    this.bot.command('app', async (ctx) => {
      const kb = new InlineKeyboard().webApp('Launch Studio ⚡', WEBAPP_URL);
      await ctx.reply('🚀 <b>Open Induktr Studio Mini App</b>', {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    });

    this.bot.command('catalog', async (ctx) => {
      const kb = new InlineKeyboard()
        .webApp('Modular UI Kit — $149', `${WEBAPP_URL}/?tab=studio`)
        .row()
        .webApp('Architecture Cheatsheets — $79', `${WEBAPP_URL}/?tab=studio`)
        .row()
        .webApp('Consultation & Audit — $299', `${WEBAPP_URL}/?tab=studio`);

      await ctx.reply(
        [
          '📦 <b>INDUKTR STUDIO — DIGITAL CATALOG</b>',
          '──────────────────────────',
          '',
          '🧩 <b>Modular UI Kit</b> — Production-ready components',
          '📐 <b>Architecture Cheatsheets</b> — System design blueprints',
          '🔬 <b>Consultation & Audit</b> — Expert engineering review',
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: kb },
      );
    });

    this.bot.command('status', async (ctx) => {
      const leadId = ctx.match?.trim();
      if (!leadId) {
        await ctx.reply(
          '⚠️ Please provide a lead/order ID.\nExample: <code>/status c4b3...</code>',
          { parse_mode: 'HTML' },
        );
        return;
      }
      await this.handleStatusQuery(ctx.chat.id, leadId);
    });

    this.bot.command('assets', async (ctx) => {
      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) {
        await ctx.reply('❌ Unable to identify your Telegram account.');
        return;
      }
      await this.handleAssetsQuery(ctx.chat.id, telegramId);
    });

    this.bot.command('intake', async (ctx) => {
      const kb = new InlineKeyboard().webApp(
        'Start Discovery Protocol →',
        `${WEBAPP_URL}/?tab=client-hub`,
      );
      await ctx.reply(
        [
          '📋 <b>DISCOVERY PROTOCOL</b>',
          '',
          'Begin the structured intake process to scope your project.',
          'Our engineering team will review your requirements within 24h.',
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: kb },
      );
    });

    this.bot.command('support', async (ctx) => {
      await ctx.reply(
        [
          '📞 <b>ENGINEERING SUPPORT</b>',
          '──────────────────────────',
          '',
          '👤 Lead Engineer: <a href="https://t.me/Induktr">@Induktr</a>',
          '🌐 Web: <a href="https://induktr-portfolio.vercel.app">induktr-portfolio.vercel.app</a>',
          '',
          'Response time: within 24 hours.',
        ].join('\n'),
        { parse_mode: 'HTML' },
      );
    });

    this.bot.command('help', async (ctx) => {
      const lines = BOT_COMMANDS.map((c) => `• <code>/${c.command}</code> — ${c.description}`);
      await ctx.reply(
        [
          '📚 <b>INDUKTR STUDIO v2.0 — COMMANDS</b>',
          '──────────────────────────',
          '',
          ...lines,
          '',
          '🌐 <a href="https://induktr-portfolio.vercel.app">Open Studio in Browser</a>',
        ].join('\n'),
        { parse_mode: 'HTML' },
      );
    });

    // Callback query handlers for inline buttons
    this.bot.callbackQuery('cmd:catalog', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('Use /catalog to browse the digital product line.');
    });

    this.bot.callbackQuery('cmd:status_prompt', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(
        'Send <code>/status YOUR_LEAD_ID</code> to check order status.',
        { parse_mode: 'HTML' },
      );
    });

    this.bot.callbackQuery('cmd:assets', async (ctx) => {
      await ctx.answerCallbackQuery();
      const telegramId = ctx.from?.id?.toString();
      if (telegramId) {
        await this.handleAssetsQuery(ctx.chat?.id ?? 0, telegramId);
      }
    });

    this.bot.callbackQuery('cmd:support', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(
        '📞 Contact: <a href="https://t.me/Induktr">@Induktr</a>',
        { parse_mode: 'HTML' },
      );
    });
  }

  /* ──────── Database Queries ──────── */

  private async handleStatusQuery(chatId: number, leadId: string): Promise<void> {
    if (!this.bot) return;

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      await this.bot.api.sendMessage(
        chatId,
        `❌ Lead <code>${this.escapeHtml(leadId)}</code> not found in Induktr Studio database.`,
        { parse_mode: 'HTML' },
      );
      return;
    }

    await this.bot.api.sendMessage(
      chatId,
      [
        '📋 <b>LEAD INFORMATION</b>',
        '──────────────────────────',
        `🆔 <b>ID:</b> <code>${lead.id}</code>`,
        `👤 <b>Client:</b> ${this.escapeHtml(lead.name)}`,
        `📊 <b>Status:</b> <code>${lead.status}</code>`,
        `💰 <b>Budget:</b> ${this.escapeHtml(lead.budget)}`,
        `🛠 <b>Service:</b> ${this.escapeHtml(lead.serviceType)}`,
        `🕒 <b>Created:</b> <code>${lead.createdAt.toISOString()}</code>`,
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }

  private async handleAssetsQuery(chatId: number, telegramId: string): Promise<void> {
    if (!this.bot) return;

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: { purchases: { include: { product: true } } },
    });

    if (!user || user.purchases.length === 0) {
      const kb = new InlineKeyboard().webApp('Browse Catalog →', `${WEBAPP_URL}/?tab=studio`);
      await this.bot.api.sendMessage(
        chatId,
        [
          '📦 <b>YOUR DIGITAL ASSETS</b>',
          '',
          'No purchased assets found for your account.',
          'Visit the catalog to explore available products.',
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: kb },
      );
      return;
    }

    const assetLines = user.purchases.map(
      (p, i) =>
        `${i + 1}. <b>${this.escapeHtml(p.product.title)}</b> — <code>${p.status}</code>`,
    );

    await this.bot.api.sendMessage(
      chatId,
      [
        '📦 <b>YOUR DIGITAL ASSETS</b>',
        '──────────────────────────',
        '',
        ...assetLines,
        '',
        `Total: ${user.purchases.length} item(s)`,
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }

  /* ──────── Lead Notifications (outbound) ──────── */

  buildNotificationMessage(lead: TelegramLeadNotification): string {
    const lines = [
      '⚡ <b>НОВАЯ ЗАЯВКА INDUKTR STUDIO v2.0</b>',
      '──────────────────────────',
      `👤 <b>Клиент:</b> ${this.escapeHtml(lead.name)}`,
      `📞 <b>Контакт:</b> ${this.escapeHtml(lead.contact)}`,
      `💰 <b>Бюджет:</b> ${this.escapeHtml(lead.budget)}`,
      `🛠 <b>Направление:</b> ${this.escapeHtml(lead.serviceType)}`,
    ];

    if (lead.referrer) {
      lines.push(`🌐 <b>Источник (Referrer):</b> ${this.escapeHtml(lead.referrer)}`);
    }

    lines.push(
      `📝 <b>Описание:</b>\n<blockquote>${this.escapeHtml(lead.description)}</blockquote>`,
      '──────────────────────────',
      `🏷 #lead #induktr #crm #${this.slugify(lead.serviceType)}`,
      `🆔 <code>${lead.id}</code> | 🕒 <i>${new Date().toISOString()}</i>`,
    );

    return lines.join('\n');
  }

  async sendLeadNotification(lead: TelegramLeadNotification, retryCount = 3): Promise<boolean> {
    if (!this.bot || !this.chatId) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Emitting stub notification.',
      );
      return true;
    }

    const message = this.buildNotificationMessage(lead);

    const kb = new InlineKeyboard()
      .webApp('Open Lead in Studio →', `${WEBAPP_URL}/?tab=client-hub`)
      .row()
      .text(`Status: ${lead.serviceType}`, `lead:${lead.id}`);

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await this.bot.api.sendMessage(this.chatId, message, {
          parse_mode: 'HTML',
          reply_markup: kb,
        });

        this.logger.log(`Telegram notification for lead ${lead.id} delivered successfully.`);
        return true;
      } catch (err) {
        this.logger.error(
          `Telegram notification attempt ${attempt}/${retryCount} failed:`,
          err,
        );
      }

      if (attempt < retryCount) {
        await new Promise((res) => setTimeout(res, attempt * 500));
      }
    }

    this.logger.error(`Failed to send Telegram notification after ${retryCount} attempts.`);
    return false;
  }

  /* ──────── Webhook Update Dispatch ──────── */

  async handleUpdate(update: unknown): Promise<void> {
    if (!this.bot) return;
    await this.bot.handleUpdate(update as Parameters<Bot['handleUpdate']>[0]);
  }

  /* ──────── Utilities ──────── */

  escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
}
