import { z } from 'zod';

export const TokenFormSchema = z.object({
  sessionToken: z.string().min(8, 'Session token must be at least 8 characters'),
});
export type TokenFormInput = z.infer<typeof TokenFormSchema>;

export const DbVerificationSchema = z.object({
  identifier: z.string().min(2, 'Enter Telegram ID, username, or email').max(100),
});
export type DbVerificationInput = z.infer<typeof DbVerificationSchema>;

export const QuickRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  firstName: z.string().min(2, 'First name required').max(50),
  email: z.string().email('Valid email address required'),
});
export type QuickRegisterInput = z.infer<typeof QuickRegisterSchema>;

export const TelegramHandshakeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required (min 1 character)')
    .max(64, 'First name cannot exceed 64 characters'),
  username: z
    .string()
    .trim()
    .min(3, 'Telegram username must be at least 3 characters')
    .max(32, 'Telegram username cannot exceed 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain Latin letters, numbers, and underscores'),
  telegramId: z
    .string()
    .trim()
    .regex(/^[1-9]\d{4,15}$/, 'Telegram ID must be a valid numeric ID (5 to 16 digits)'),
  initData: z
    .string()
    .trim()
    .min(10, 'initData string cannot be empty')
    .refine((val) => val.includes('hash=') && val.includes('auth_date='), {
      message: 'initData must be a valid query string containing hash and auth_date',
    }),
});
export type TelegramHandshakeInput = z.infer<typeof TelegramHandshakeSchema>;
