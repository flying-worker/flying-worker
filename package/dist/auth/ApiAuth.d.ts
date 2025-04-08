import { ApiTokenPayload, AuthenticatedUser } from '../type-declaration/model.js';

declare class JwtAuthManager {
    createToken(payload: ApiTokenPayload): Promise<string | null>;
    delete(deleteAll?: boolean): Promise<void>;
    check(): boolean;
    user(guard?: string): Promise<AuthenticatedUser | null>;
    private getToken;
    private getCurrentGuardData;
    private formatUserData;
    private hasRole;
    private hasPermission;
    private hasTokenPermission;
    private setUser;
}
declare const JwtAuth: JwtAuthManager;

export { JwtAuth as default };
