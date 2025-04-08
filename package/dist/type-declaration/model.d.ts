type UserModel<T extends {
    id: number;
    name: string;
    email: string;
}> = T;
type RolePermission = {
    id: number;
    role: string;
    permissions: string[];
    [key: string]: unknown;
};
type AuthUser = {
    id: number;
    name: string;
    email: string;
    rolePermissions?: [RolePermission] | [];
    [key: string]: unknown;
};
type AuthenticatedUser = {
    id: number;
    name: string;
    email: string;
    hasRole: (role: string | [string]) => boolean;
    hasPermission: (permission: string | [string]) => boolean;
    hasTokenPermission?: (permission: string | [string]) => boolean;
    rolePermissions?: RolePermission[] | [];
    [key: string]: unknown;
};
type TokenData = {
    name?: string;
    abilities?: [string];
    maxAge?: number | string;
};
type ApiTokenPayload = {
    name?: string;
    user: AuthUser;
    guard?: string;
    permissions?: [string];
    maxAge: number | string;
    [key: string]: unknown;
};
type JwtTokenPayload = {
    user: AuthUser;
    abilities?: [string];
    exp?: number;
};

export type { ApiTokenPayload, AuthUser, AuthenticatedUser, JwtTokenPayload, RolePermission, TokenData, UserModel };
