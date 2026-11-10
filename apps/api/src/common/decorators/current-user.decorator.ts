import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserData {
  id: string; // Internal Prisma UUID or Telegram ID
  telegramId?: string;
  username?: string;
  firstName?: string;
  role?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserData | undefined => {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext()?.req || context.switchToHttp()?.getRequest?.();
    return req?.user;
  },
);
