import { HttpMethod, HandlerFunction } from '../type-declaration/route.js';
import 'hono';

declare class RouteManager {
    private routes;
    private groupPrefix;
    private groupMiddlewares;
    private add;
    group(prefix: string, callback: () => void, middlewares?: string[]): void;
    getRoutes(): {
        method: HttpMethod;
        path: string;
        handler: HandlerFunction;
        middlewares: string[];
    }[];
    get(path: string, handler: HandlerFunction | [any, string], middlewares?: string[]): void;
    post(path: string, handler: HandlerFunction | [any, string], middlewares?: string[]): void;
    put(path: string, handler: HandlerFunction | [any, string], middlewares?: string[]): void;
    delete(path: string, handler: HandlerFunction | [any, string], middlewares?: string[]): void;
    reset(): void;
    all(path: string, handler: HandlerFunction | [any, string], middlewares?: string[]): void;
}
declare let Route: RouteManager;

export { Route as default };
