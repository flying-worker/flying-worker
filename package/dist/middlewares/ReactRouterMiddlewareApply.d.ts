import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare abstract class ReactRouteMiddlewareApply extends BaseMiddleware {
    protected abstract loadRoutes(): Promise<void>;
    boot(context: Context, next: Next): Promise<void | Response>;
}

export { ReactRouteMiddlewareApply as default };
