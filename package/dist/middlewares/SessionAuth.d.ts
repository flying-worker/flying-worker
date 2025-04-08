import * as hono from 'hono';
import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare class SessionAuth extends BaseMiddleware {
    protected redirectPath: string;
    private guard;
    setGuard(guard?: string): void;
    boot(context: Context, next: Next): Promise<void | (Response & hono.TypedResponse<undefined, 302, "redirect">)>;
}

export { SessionAuth as default };
