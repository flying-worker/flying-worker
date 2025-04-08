import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare class Cors extends BaseMiddleware {
    boot(context: Context, next: Next): Promise<void | Response>;
}

export { Cors as default };
