import { createHmac, randomBytes } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthResponseSchema,
  TelegramAuthSchema,
  UserProfileSchema,
} from '@induktr/contracts';
import { PrismaService } from '../prisma/prisma.service';
import type { UserResponse } from '../ecommerce/dto/ecommerce.dto';

export interface TelegramParsedUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly botToken: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  async authenticateWithTelegram(rawInitData: string): Promise<{ token: string; user: UserResponse }> {
    const { initData } = TelegramAuthSchema.parse({ initData: rawInitData });

    const isValid = this.verifyTelegramSignature(initData);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram cryptographic signature');
    }

    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) {
      throw new UnauthorizedException('Missing user payload in Telegram initData');
    }

    const tgUser = JSON.parse(userJson) as TelegramParsedUser;
    const user = await this.syncTelegramUser(tgUser);

    // Create session record
    const sessionToken = randomBytes(32).toString('hex');
    const tokenHash = createHmac('sha256', 'session_salt').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const validatedResponse = AuthResponseSchema.parse({
      token: sessionToken,
      user,
    });

    return validatedResponse as unknown as { token: string; user: UserResponse };
  }

  async syncTelegramUser(tgUser: TelegramParsedUser): Promise<UserResponse> {
    const tgIdStr = String(tgUser.id);
    let user = await this.prisma.user.findFirst({
      where: { telegramId: tgIdStr },
    });

    if (!user) {
      this.logger.log(`Provisioning new Studio User for Telegram ID ${tgIdStr} (${tgUser.username || tgUser.first_name})`);
      user = await this.prisma.user.create({
        data: {
          telegramId: tgIdStr,
          username: tgUser.username,
          firstName: tgUser.first_name,
          role: 'CLIENT',
        },
      });
    } else if (user.username !== tgUser.username || user.firstName !== tgUser.first_name) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: tgUser.username,
          firstName: tgUser.first_name,
        },
      });
    }

    const validatedUser = UserProfileSchema.parse({
      id: user.id,
      telegramId: user.telegramId ?? undefined,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });

    return validatedUser as unknown as UserResponse;
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const validatedUser = UserProfileSchema.parse({
      id: user.id,
      telegramId: user.telegramId ?? undefined,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });

    return validatedUser as unknown as UserResponse;
  }

  async checkUserExists(identifier: string): Promise<{ exists: boolean; user?: UserResponse | null }> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { exists: false, user: null };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { telegramId: trimmed },
          { email: trimmed.toLowerCase() },
          { username: trimmed.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return { exists: false, user: null };
    }

    const validatedUser = UserProfileSchema.parse({
      id: user.id,
      telegramId: user.telegramId ?? undefined,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });

    return {
      exists: true,
      user: validatedUser as unknown as UserResponse,
    };
  }

  async registerUser(input: {
    username?: string;
    firstName?: string;
    email?: string;
    telegramId?: string;
  }): Promise<{ token: string; user: UserResponse }> {
    const user = await this.prisma.user.create({
      data: {
        username: input.username?.trim(),
        firstName: input.firstName?.trim() || 'Studio Member',
        email: input.email?.trim()?.toLowerCase(),
        telegramId: input.telegramId?.trim(),
        role: 'CLIENT',
      },
    });

    const sessionToken = randomBytes(32).toString('hex');
    const tokenHash = createHmac('sha256', 'session_salt').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const validatedUser = UserProfileSchema.parse({
      id: user.id,
      telegramId: user.telegramId ?? undefined,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });

    return {
      token: sessionToken,
      user: validatedUser as unknown as UserResponse,
    };
  }

  async loginAsDemoFounder(): Promise<{ token: string; user: UserResponse }> {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { telegramId: '123456789' },
          { username: 'alexmorgan' },
        ],
      },
    });

    if (!user) {
      this.logger.log('Provisioning Founder Alex Morgan for demo session');
      user = await this.prisma.user.create({
        data: {
          id: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
          telegramId: '123456789',
          username: 'alexmorgan',
          firstName: 'Alex Morgan',
          email: 'alex@orbit.build',
          role: 'CLIENT',
        },
      });
    }

    const sessionToken = 'ind_session_' + randomBytes(24).toString('hex');
    const tokenHash = createHmac('sha256', 'session_salt').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const validatedUser = UserProfileSchema.parse({
      id: user.id,
      telegramId: user.telegramId ?? undefined,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });

    return {
      token: sessionToken,
      user: validatedUser as unknown as UserResponse,
    };
  }

  generateDevTelegramInitData(
    userId = '123456789',
    username = 'alexmorgan',
    firstName = 'Alex',
    lastName = 'Morgan',
  ): string {
    const userPayload = JSON.stringify({
      id: Number(userId) || 123456789,
      first_name: firstName,
      last_name: lastName,
      username,
      language_code: 'en',
    });

    const now = Math.floor(Date.now() / 1000);
    const params = new Map<string, string>();
    params.set('auth_date', String(now));
    params.set('user', userPayload);

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    let hash = 'simulated_dev_hmac_hash';
    if (this.botToken) {
      const secretKey = createHmac('sha256', 'WebAppData').update(this.botToken).digest();
      hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    }

    return `user=${encodeURIComponent(userPayload)}&auth_date=${now}&hash=${hash}`;
  }

  private verifyTelegramSignature(initData: string): boolean {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured — permitting bypass in non-production.');
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (!hash) return false;

      params.delete('hash');
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

      const secretKey = createHmac('sha256', 'WebAppData').update(this.botToken).digest();
      const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      return computedHash === hash;
    } catch {
      return false;
    }
  }
}
