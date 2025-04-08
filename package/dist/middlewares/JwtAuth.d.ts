import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare class JwtAuth extends BaseMiddleware {
    private guard;
    setGuard(guard?: string): void;
    boot(context: Context, next: Next): Promise<void | Response>;
}

export { JwtAuth as default };
