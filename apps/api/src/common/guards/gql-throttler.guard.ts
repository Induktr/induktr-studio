/* oxlint-disable typescript/no-explicit-any */
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, any>;
    res: Record<string, any>;
  } {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<{ req?: Record<string, any>; res?: Record<string, any> }>();

    if (ctx && ctx.req) {
      return { req: ctx.req, res: ctx.res || {} };
    }

    return super.getRequestResponse(context);
  }
}
