import * as hono from 'hono';
import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare class CsrfToken extends BaseMiddleware {
    protected isExceptPath: (path: string) => boolean;
    boot(context: Context, next: Next): Promise<(Response & hono.TypedResponse<{
        error: string;
    }, 403, "json">) | undefined>;
}

export { CsrfToken as default };
