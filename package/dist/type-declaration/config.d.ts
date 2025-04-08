import { Table, TableConfig, Column, ColumnBaseConfig } from 'drizzle-orm';
import { Context } from 'hono';
import { B as BaseMiddleware } from '../BaseMiddleware-Bk0a6aM5.js';
import BaseListener from '../event/BaseListener.js';

type RolePermissionModelConstraint = Table<TableConfig> & {
    id: Column<ColumnBaseConfig<"number", string>>;
    user_id: Column<ColumnBaseConfig<"number", string>>;
    role: Column<ColumnBaseConfig<"string", string>>;
    permissions: Column<ColumnBaseConfig<"string", string>>;
};
interface SessionGuardConfig {
    driver: "session";
    userTable: string;
    rolePermissionTable: string;
}
interface UseCookie {
    status: boolean;
    maxAge: string | number;
    key: string;
}
interface JwtGuardConfig {
    driver: "jwt";
    useCookie: UseCookie;
    userTable: string;
    rolePermissionTable?: string;
    tokenTable?: string;
}
interface AuthConfig {
    defaultGuard: string;
    guards: {
        web: SessionGuardConfig;
        api: JwtGuardConfig;
        [key: string]: SessionGuardConfig | JwtGuardConfig;
    };
}
interface CorsConfig {
    origin: string | string[] | ((origin: string, c: Context) => string);
    allowHeaders: string[];
    allowMethods: string[];
    exposeHeaders: string[];
    maxAge: number;
    credentials: boolean;
}
interface CsrfTokenConfig {
    origin: "same" | string | string[];
    except: string[];
}
type CallbackListener = (...args: any[]) => Promise<void> | void;
type ClassListener = (new (...args: any[]) => BaseListener)[] | (new (...args: any[]) => BaseListener);
type Listener = CallbackListener | ClassListener;
interface Events {
    [key: string]: Listener;
}
interface MiddlewaresConfig {
    global: (new () => BaseMiddleware)[];
    web: (new () => BaseMiddleware)[];
    reactRouter: (new () => BaseMiddleware)[];
    api: (new () => BaseMiddleware)[];
    aliases: MiddlewareAliasType;
}
type MiddlewareAliasType = {
    sessionAuth?: new () => BaseMiddleware;
    jwtAuth?: new () => BaseMiddleware;
} & {
    [key: string]: new () => BaseMiddleware;
};
type AppConfig = {
    name: string;
    secret: string;
    environment: string;
    url: string;
    timezone: string;
    locale: string;
    maintenance: {
        status: boolean;
        message: string;
    };
    apiRoute: () => Promise<void>;
    webRoute: () => Promise<void>;
};
type QueueConfig = {
    bindingName: string;
    syncQueue: boolean;
};
type D1Connection = {
    connection: () => ReturnType<any>;
};
type DatabaseConnectionMap = {
    d1: D1Connection;
    [key: string]: D1Connection;
};
type DatabaseConfig = {
    default: string;
    connections: DatabaseConnectionMap;
};
type SessionConfig = {
    status: boolean;
    avoidPath: string[];
    driver: string;
    lifetime: number;
    expireOnClose: boolean;
    lottery: [number, number];
    cookie: string;
    path: string;
    domain?: string;
    secure: boolean | undefined;
    httpOnly: boolean;
    sameSite: "Strict" | "Lax" | "None" | "strict" | "lax" | "none";
};
type Config = {
    app: AppConfig;
    session: SessionConfig;
    auth: AuthConfig;
    db: DatabaseConfig;
    cors: CorsConfig;
    csrf: CsrfTokenConfig;
    middlewares: MiddlewaresConfig;
    eventListener: Events;
    queue: QueueConfig;
};

export type { AppConfig, AuthConfig, Config, CorsConfig, CsrfTokenConfig, DatabaseConfig, Events, JwtGuardConfig, MiddlewareAliasType, MiddlewaresConfig, QueueConfig, RolePermissionModelConstraint, SessionConfig, SessionGuardConfig };
