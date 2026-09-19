export { SessionManager } from "./SessionManager"; 
export { sessionMiddleware } from "./SessionMiddleware";
export type { SessionData } from "./SessionManager";

import { resolveSession, SessionStore } from "./Session";

export const Session = {
    put: (...args: Parameters<SessionStore['put']>) => {
        return resolveSession().put(...args);
    },
    get: <T = any>(key: string, defaultValue?: T): T => {
        return resolveSession().get<T>(key, defaultValue);
    },
    has: (...args: Parameters<SessionStore['has']>) => {
        return resolveSession().has(...args);
    },
    forget: (...args: Parameters<SessionStore['forget']>) => {
        return resolveSession().forget(...args);
    },
    all: () => {
        return resolveSession().all();
    },
    flush: () => {
        return resolveSession().flush();
    },
    save: () => {
        return resolveSession().save();
    },
    flash: (...args: Parameters<SessionStore['flash']>) => {
        return resolveSession().flash(...args);
    },

    regenerate: (...args: Parameters<SessionStore['regenerate']>) => {
        return resolveSession().regenerate(...args);
    },
    invalidate: () => {
        return resolveSession().invalidate();
    },
    getId: () => {
        return resolveSession().getId();
    },
    initialize: () => {
        return resolveSession().initialize();
    }
};
