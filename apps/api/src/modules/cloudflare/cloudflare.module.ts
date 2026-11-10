import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudFlareService } from './cloudflare.service';
import { CloudeFlareController } from './cloudflare.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CloudeFlareController],
  providers: [CloudFlareService],
  exports: [CloudFlareService],
})
export class CloudeFlareModule {}
