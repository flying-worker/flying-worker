import { AuthUser, AuthenticatedUser } from '../type-declaration/model.js';

declare class AuthManager {
    logout(): Promise<void>;
    private regenerateSession;
    login(user: AuthUser, remember?: boolean): Promise<void>;
    attempt(credentials: {
        [key: string]: string;
    }, remember?: boolean): Promise<any>;
    check(guard?: string): boolean;
    user(): Promise<AuthenticatedUser | null>;
    private sessionKey;
    private formatUserData;
    private hasRole;
    private hasPermission;
    private setUser;
}
declare const Auth: AuthManager;

export { Auth as default };
