import { Hono } from 'hono';
import { Config } from '../type-declaration/config.js';
import 'drizzle-orm';
import '../BaseMiddleware-Bk0a6aM5.js';
import '../event/BaseListener.js';

declare class Application {
    readonly hono: Hono;
    config: Config;
    private currentStates;
    apiPrefix: string;
    constructor();
    boot(config: Config): Promise<void>;
    loadConfig(config: Config): void;
    addToCurrentState(key: string, value: unknown): void;
    getCurrentState(key: string): any;
    basicInit(): void;
    setEnv(env: Record<string, unknown>): void;
    setRequest(request: Request): void;
    private applyRoutes;
    private initiateHonoRoute;
    private activePoweredByMiddleware;
    private activeGlobalMiddleware;
    private activeWebMiddleware;
    private activeReactRouterMiddleware;
    private activeApiMiddleware;
}
declare let App: Application;

export { App as default };
