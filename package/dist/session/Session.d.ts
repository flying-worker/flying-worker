import * as react_router from 'react-router';
import { Session as Session$1, SessionStorage } from 'react-router';

declare class SessionManager {
    private session;
    private sessionStorage;
    getSession(): Session$1<react_router.SessionData, react_router.SessionData>;
    getStorage(): SessionStorage<react_router.SessionData, react_router.SessionData>;
    get(key: string, defaultValue?: any): any;
    set(key: string, value: any): void;
    destroy(): Promise<void>;
    rawData(): Partial<react_router.SessionData & {
        [x: `__flash_${string}__`]: any;
    }>;
    flash(key: string, value: any): void;
    forget(key: string): void;
    has(key: string): boolean;
}
declare let Session: SessionManager;

export { Session as default };
