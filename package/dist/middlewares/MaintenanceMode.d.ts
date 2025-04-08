import { Context, Next } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';

declare class MaintenanceMode extends BaseMiddleware {
    boot(context: Context, next: Next): Promise<Response | undefined>;
}

export { MaintenanceMode as default };
