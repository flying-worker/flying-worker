import { z } from 'zod';
export { JwtGuardConfigSchema } from './jwt-guard.js';

declare const AuthUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    email: z.ZodString;
    rolePermissions: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        role: z.ZodString;
        permissions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: number;
        role: string;
        permissions: string[];
    }, {
        id: number;
        role: string;
        permissions: string[];
    }>>>;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    email: string;
    rolePermissions?: {
        id: number;
        role: string;
        permissions: string[];
    } | null | undefined;
}, {
    id: number;
    name: string;
    email: string;
    rolePermissions?: {
        id: number;
        role: string;
        permissions: string[];
    } | null | undefined;
}>;
declare const JwtTokenPayloadSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    user: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        email: z.ZodString;
        rolePermissions: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            role: z.ZodString;
            permissions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            id: number;
            role: string;
            permissions: string[];
        }, {
            id: number;
            role: string;
            permissions: string[];
        }>>>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        email: string;
        rolePermissions?: {
            id: number;
            role: string;
            permissions: string[];
        } | null | undefined;
    }, {
        id: number;
        name: string;
        email: string;
        rolePermissions?: {
            id: number;
            role: string;
            permissions: string[];
        } | null | undefined;
    }>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAge: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, "strip", z.ZodUnknown, z.objectOutputType<{
    name: z.ZodOptional<z.ZodString>;
    user: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        email: z.ZodString;
        rolePermissions: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            role: z.ZodString;
            permissions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            id: number;
            role: string;
            permissions: string[];
        }, {
            id: number;
            role: string;
            permissions: string[];
        }>>>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        email: string;
        rolePermissions?: {
            id: number;
            role: string;
            permissions: string[];
        } | null | undefined;
    }, {
        id: number;
        name: string;
        email: string;
        rolePermissions?: {
            id: number;
            role: string;
            permissions: string[];
        } | null | undefined;
    }>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAge: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, z.ZodUnknown, "strip">, z.objectInputType<{
    name: z.ZodOptional<z.ZodString>;
    user: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        email: z.ZodString;
        rolePermissions: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            role: z.ZodString;
            permissions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            id: number;
            role: string;
            permissions: string[];
        }, {
            id: number;
            role: string;
            permissions: string[];
        }>>>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        email: string;
        rolePermissions?: {
            id: number;
            role: string;
            permissions: string[];
        } | null | undefined;
    }, {
        id: number;
        name: string;
        email: string;
        rolePermissions?: {
            id: number;
            role: string;
            permissions: string[];
        } | null | undefined;
    }>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAge: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, z.ZodUnknown, "strip">>;

export { AuthUserSchema, JwtTokenPayloadSchema };
