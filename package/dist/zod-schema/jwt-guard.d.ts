import { z } from 'zod';

declare const JwtGuardConfigSchema: z.ZodObject<{
    driver: z.ZodLiteral<"jwt">;
    useCookie: z.ZodObject<{
        status: z.ZodBoolean;
        maxAge: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        key: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        maxAge: string | number;
        key: string;
        status: boolean;
    }, {
        maxAge: string | number;
        key: string;
        status: boolean;
    }>;
    userModel: z.ZodObject<{
        id: z.ZodAny;
        email: z.ZodAny;
        provider_name: z.ZodAny;
        provider_id: z.ZodAny;
        avatar: z.ZodAny;
        remember_token: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        id?: any;
        email?: any;
        provider_name?: any;
        provider_id?: any;
        avatar?: any;
        remember_token?: any;
    }, {
        id?: any;
        email?: any;
        provider_name?: any;
        provider_id?: any;
        avatar?: any;
        remember_token?: any;
    }>;
    rolePermissionModel: z.ZodOptional<z.ZodObject<{
        id: z.ZodAny;
        user_id: z.ZodAny;
        role: z.ZodAny;
        permissions: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        id?: any;
        role?: any;
        permissions?: any;
        user_id?: any;
    }, {
        id?: any;
        role?: any;
        permissions?: any;
        user_id?: any;
    }>>;
    tokenModel: z.ZodOptional<z.ZodObject<{
        id: z.ZodAny;
        user_id: z.ZodAny;
        name: z.ZodAny;
        token: z.ZodAny;
        permissions: z.ZodAny;
        expires_at: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        id?: any;
        permissions?: any;
        name?: any;
        user_id?: any;
        token?: any;
        expires_at?: any;
    }, {
        id?: any;
        permissions?: any;
        name?: any;
        user_id?: any;
        token?: any;
        expires_at?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    driver: "jwt";
    useCookie: {
        maxAge: string | number;
        key: string;
        status: boolean;
    };
    userModel: {
        id?: any;
        email?: any;
        provider_name?: any;
        provider_id?: any;
        avatar?: any;
        remember_token?: any;
    };
    rolePermissionModel?: {
        id?: any;
        role?: any;
        permissions?: any;
        user_id?: any;
    } | undefined;
    tokenModel?: {
        id?: any;
        permissions?: any;
        name?: any;
        user_id?: any;
        token?: any;
        expires_at?: any;
    } | undefined;
}, {
    driver: "jwt";
    useCookie: {
        maxAge: string | number;
        key: string;
        status: boolean;
    };
    userModel: {
        id?: any;
        email?: any;
        provider_name?: any;
        provider_id?: any;
        avatar?: any;
        remember_token?: any;
    };
    rolePermissionModel?: {
        id?: any;
        role?: any;
        permissions?: any;
        user_id?: any;
    } | undefined;
    tokenModel?: {
        id?: any;
        permissions?: any;
        name?: any;
        user_id?: any;
        token?: any;
        expires_at?: any;
    } | undefined;
}>;

export { JwtGuardConfigSchema };
