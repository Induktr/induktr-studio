import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { TelegramAuthGuard } from './telegram-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [AuthService, AuthResolver, TelegramAuthGuard],
  exports: [AuthService, TelegramAuthGuard],
})
export class AuthModule {}
