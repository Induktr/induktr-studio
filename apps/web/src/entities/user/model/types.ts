export interface UserProfile {
  id: string;
  telegramId?: string;
  username?: string;
  firstName?: string;
  email?: string;
  role: 'CLIENT' | 'STUDIO_LEAD' | 'ADMIN';
  createdAt: string;
}
