import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare abstract class ReactRouter extends BaseMiddleware {
    protected abstract getServerBuild(): Promise<unknown>;
    boot(context: Context, next: Next): Promise<Response>;
}

export { ReactRouter as default };
