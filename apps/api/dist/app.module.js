var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { resolve } from 'node:path';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { AuthModule } from './modules/auth/auth.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { LeadModule } from './modules/lead/lead.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TelegramModule } from './modules/telegram/telegram.module';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            GraphQLModule.forRoot({
                driver: ApolloDriver,
                autoSchemaFile: resolve(process.cwd(), 'schema.gql'),
                sortSchema: true,
                playground: true,
                introspection: true,
                context: ({ req, res }) => ({ req, res }),
            }),
            PrismaModule,
            LeadModule,
            TelegramModule,
            AuthModule,
            EcommerceModule,
        ],
        providers: [
            {
                provide: APP_GUARD,
                useClass: GqlThrottlerGuard,
            },
        ],
    })
], AppModule);
export { AppModule };
