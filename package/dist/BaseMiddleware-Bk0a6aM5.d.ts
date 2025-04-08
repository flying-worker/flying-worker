import { Context, Next } from 'hono';

declare abstract class BaseMiddleware {
    abstract boot(context: Context, next: Next): Promise<Response | void | undefined>;
}

export { BaseMiddleware as B };
