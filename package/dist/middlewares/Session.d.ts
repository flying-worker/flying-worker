import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare class Session extends BaseMiddleware {
    protected isAvoidPath: (path: string) => boolean;
    boot(context: Context, next: Next): Promise<any>;
}

export { Session as default };
