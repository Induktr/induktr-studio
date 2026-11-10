import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { GqlUserRole } from '../ecommerce/dto/ecommerce.dto';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let mockConfig: ConfigService;
  let mockPrisma: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    session: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  let service: AuthService;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return 'fake-bot-token';
        return undefined;
      }),
    } as unknown as ConfigService;

    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      session: {
        create: vi.fn(),
      },
    };

    service = new AuthService(mockConfig, mockPrisma as unknown as PrismaService);
  });

  it('provisions new User on first Telegram sync', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'uuid-user-1',
      telegramId: '123456789',
      username: 'tech_lead',
      firstName: 'Nikita',
      role: 'CLIENT',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    });

    const user = await service.syncTelegramUser({
      id: 123456789,
      first_name: 'Nikita',
      username: 'tech_lead',
    });

    expect(user.id).toBe('uuid-user-1');
    expect(user.telegramId).toBe('123456789');
    expect(user.role).toBe(GqlUserRole.CLIENT);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        telegramId: '123456789',
        username: 'tech_lead',
        firstName: 'Nikita',
        role: 'CLIENT',
      },
    });
  });

  it('updates existing User when username or name changes', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'uuid-user-1',
      telegramId: '123456789',
      username: 'old_username',
      firstName: 'Nikita',
      role: 'CLIENT',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    });

    mockPrisma.user.update.mockResolvedValue({
      id: 'uuid-user-1',
      telegramId: '123456789',
      username: 'new_username',
      firstName: 'Nikita',
      role: 'CLIENT',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    });

    const user = await service.syncTelegramUser({
      id: 123456789,
      first_name: 'Nikita',
      username: 'new_username',
    });

    expect(user.username).toBe('new_username');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'uuid-user-1' },
      data: {
        username: 'new_username',
        firstName: 'Nikita',
      },
    });
  });

  it('retrieves user profile via getMe', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'uuid-user-1',
      telegramId: '123456789',
      username: 'nikita',
      firstName: 'Nikita',
      email: 'nikita@induktr.studio',
      role: 'ADMIN',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    });

    const profile = await service.getMe('uuid-user-1');
    expect(profile.id).toBe('uuid-user-1');
    expect(profile.role).toBe(GqlUserRole.ADMIN);
  });

  it('checks if user exists in database by identifier', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'uuid-user-1',
      telegramId: '123456789',
      username: 'tech_lead',
      firstName: 'Nikita',
      role: 'CLIENT',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    });

    const found = await service.checkUserExists('tech_lead');
    expect(found.exists).toBe(true);
    expect(found.user?.username).toBe('tech_lead');

    mockPrisma.user.findFirst.mockResolvedValueOnce(null);
    const notFound = await service.checkUserExists('non_existing_user');
    expect(notFound.exists).toBe(false);
    expect(notFound.user).toBeNull();
  });

  it('registers new user and creates session in database', async () => {
    mockPrisma.user.create.mockResolvedValueOnce({
      id: 'uuid-new-user',
      telegramId: '987654321',
      username: 'new_client',
      firstName: 'Sarah',
      email: 'sarah@example.com',
      role: 'CLIENT',
      createdAt: new Date('2026-10-26T12:00:00Z'),
    });
    mockPrisma.session.create.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'uuid-new-user',
    });

    const response = await service.registerUser({
      username: 'new_client',
      firstName: 'Sarah',
      email: 'sarah@example.com',
      telegramId: '987654321',
    });

    expect(response.token).toBeDefined();
    expect(response.user.id).toBe('uuid-new-user');
    expect(response.user.username).toBe('new_client');
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  it('logs in as demo founder and creates persistent session', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
      telegramId: '123456789',
      username: 'alexmorgan',
      firstName: 'Alex Morgan',
      email: 'alex@orbit.build',
      role: 'CLIENT',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    });
    mockPrisma.session.create.mockResolvedValueOnce({
      id: 'session-demo',
      userId: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
    });

    const response = await service.loginAsDemoFounder();
    expect(response.token).toContain('ind_session_');
    expect(response.user.username).toBe('alexmorgan');
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });
});
