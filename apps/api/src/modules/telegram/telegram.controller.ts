import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

/**
 * Telegram Webhook Controller — Induktr Studio v2.0
 *
 * Receives raw Telegram updates from the Bot API webhook and delegates
 * them to GrammY's `bot.handleUpdate()` for type-safe processing.
 *
 * The secret token header (`X-Telegram-Bot-Api-Secret-Token`) is validated
 * when `TELEGRAM_WEBHOOK_SECRET` is configured in the environment.
 */
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private readonly secretToken: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly telegramService: TelegramService,
  ) {
    this.secretToken = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-telegram-bot-api-secret-token') headerSecret: string | undefined,
    @Body() update: unknown,
  ): Promise<{ ok: boolean }> {
    // Validate secret token if configured
    if (this.secretToken && headerSecret !== this.secretToken) {
      this.logger.warn('Rejected Telegram webhook update: invalid secret token header.');
      throw new UnauthorizedException('Invalid Telegram webhook secret token');
    }

    if (!update || typeof update !== 'object') {
      return { ok: true };
    }

    this.logger.log(`Received Telegram webhook update_id=${(update as Record<string, unknown>).update_id ?? 'N/A'}`);

    // Delegate the raw update to GrammY's Bot.handleUpdate()
    // This dispatches to all registered command/callback handlers in TelegramService
    try {
      await this.telegramService.handleUpdate(update);
    } catch (err) {
      this.logger.error('Error processing Telegram update via GrammY:', err);
    }

    return { ok: true };
  }
}
