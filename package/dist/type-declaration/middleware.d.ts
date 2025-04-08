import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

type MiddlewareInstance = {
    boot: (c: Context, next: Next) => Promise<Response | void | undefined>;
};
type MiddlewareClass = new () => BaseMiddleware;

export type { MiddlewareClass, MiddlewareInstance };
