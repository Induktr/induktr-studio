var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let TelegramService = TelegramService_1 = class TelegramService {
    config;
    logger = new Logger(TelegramService_1.name);
    botToken;
    chatId;
    constructor(config) {
        this.config = config;
        this.botToken = this.config.get('TELEGRAM_BOT_TOKEN');
        this.chatId = this.config.get('TELEGRAM_CHAT_ID');
    }
    buildNotificationMessage(lead) {
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
        lines.push(`📝 <b>Описание:</b>\n<blockquote>${this.escapeHtml(lead.description)}</blockquote>`, '──────────────────────────', `🏷 #lead #induktr #crm #${this.slugify(lead.serviceType)}`, `🆔 <code>${lead.id}</code> | 🕒 <i>${new Date().toISOString()}</i>`);
        return lines.join('\n');
    }
    async sendLeadNotification(lead, retryCount = 3) {
        if (!this.botToken || !this.chatId) {
            this.logger.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Emitting stub notification.');
            return true;
        }
        const message = this.buildNotificationMessage(lead);
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                });
                if (response.ok) {
                    this.logger.log(`Telegram notification for lead ${lead.id} delivered successfully.`);
                    return true;
                }
                const errorText = await response.text();
                this.logger.warn(`Telegram API attempt ${attempt}/${retryCount} failed: ${errorText}`);
            }
            catch (err) {
                this.logger.error(`Network error during Telegram dispatch (attempt ${attempt}/${retryCount}):`, err);
            }
            if (attempt < retryCount) {
                // Exponential backoff
                await new Promise((res) => setTimeout(res, attempt * 500));
            }
        }
        this.logger.error(`Failed to send Telegram notification after ${retryCount} attempts.`);
        return false;
    }
    escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
};
TelegramService = TelegramService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], TelegramService);
export { TelegramService };
