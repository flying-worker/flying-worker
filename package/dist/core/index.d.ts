export { default as App } from './Application.js';
export { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';
import { Context } from 'hono';
import '../type-declaration/config.js';
import 'drizzle-orm';
import '../event/BaseListener.js';

declare class RequestData {
    private readonly request;
    private requestData;
    private headers;
    private context;
    constructor(request: Request);
    private init;
    all(): Record<string, unknown>;
    setContext(context: Context): void;
    getContext(): Context;
    input(key: string, defaultValue?: unknown): any;
    get(key: string, defaultValue?: unknown): unknown;
    getRequest(): Request;
    header(key: string, defaultValue?: string): string;
    allHeaders(): Record<string, string>;
    isMethod(method: string): boolean;
    ip(): string;
}
declare let Request: RequestData;
declare function setEnv(env: Record<string, unknown>): void;
declare function getEnv(key: string, defaultValue?: unknown): any;

export { Request, getEnv, setEnv };
