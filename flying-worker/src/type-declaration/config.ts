import { Context } from "hono";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import BaseMiddleware from "../core/abstraction/BaseMiddleware";
import { R2Config } from "./storage";
// import BaseListener from "../event/BaseListener";


export interface SessionGuardConfig {
	driver: "session";
	/** The Drizzle table for users (schema object, e.g. `users`). */
	userTable: SQLiteTable;
	/** The Drizzle table holding per-user roles/permissions. */
	rolePermissionTable: SQLiteTable;
}

interface UseCookie {
	status: boolean;
	maxAge: string | number;
	key: string;
}

export interface JwtGuardConfig {
	driver: "jwt";
	useCookie: UseCookie;
	/** The Drizzle table for users (schema object, e.g. `users`). */
	userTable: SQLiteTable;
	/** The Drizzle table holding per-user roles/permissions. */
	rolePermissionTable?: SQLiteTable;
	/** The Drizzle table storing issued API tokens. */
	tokenTable?: SQLiteTable;
}

interface AuthConfig {
	defaultWebGuard: string;
	defaultApiGuard: string;
	guards: {
		web: SessionGuardConfig;
		api: JwtGuardConfig;
		[key: string]: SessionGuardConfig | JwtGuardConfig;
	};
}

interface CorsConfig {
	origin: string | string[] | ((origin: string, c: Context) => string); // array or string
	allowHeaders: string[];
	allowMethods: string[];
	exposeHeaders: string[];
	maxAge: number;
	credentials: boolean;
}

interface CsrfTokenConfig {
	avoidPath: string[]; // Laravel's $except equivalent
}

type CallbackListener = (...args: any[]) => Promise<void> | void;
// type ClassListener =
// 	| (new (
// 			...args: any[]
// 	  ) => BaseListener)[]
// 	| (new (
// 			...args: any[]
// 	  ) => BaseListener);

type Listener = CallbackListener ;

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
	maintenance: { status: boolean; message: string };
	apiPrefix: string;
	apiRoute: () => Promise<void>;
	webRoute: () => Promise<void>;
};

type QueueConfig = {
	bindingName: string;
	syncQueue: boolean;
};

type D1Connection = {
	connection: () => DrizzleD1Database<Record<string, unknown>>;
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
	driver: 'kv' | 'cookie';
	lifetime: number; // in minute
	expireOnClose: boolean;
	lottery: [number, number]; // Tuple representing [probability, outOf]
	cookie_name: string;
	path: string;
	domain?: string; // Optional because it might be undefined
	secure: boolean | undefined;
	httpOnly: boolean;
	sameSite:  "lax" | "strict" | "none";
};

export type GoogleOAuth = {
	clientId: string;
	clientSecret: string;
	redirectPath: string;
};

export type LinkedInOAuth = {
	clientId: string;
	clientSecret: string;
	redirectPath: string;
	scopes: string[];
};

export type XOAuth = {
	clientId: string;
	clientSecret: string;
	redirectPath: string;
	scopes: string[];
};

export type Github = {
	clientId: string;
	clientSecret: string;
	redirectPath: string;
	scopes?: string[];
	oauthApp?: boolean;
};

export type SocialAuth = {
	google?: GoogleOAuth;
	linkedin?: LinkedInOAuth;
	x?: XOAuth;
	github?: Github;
};

/** Props passed to the Inertia root document component. */
export type InertiaRootViewProps = {
	page: unknown;
	assets: string;
	head?: string;
};

/** A root document component (hono/jsx) returning the rendered HTML node. */
export type InertiaRootView = (props: InertiaRootViewProps) => unknown;

export type InertiaConfig = {
	/** Override the default hono/jsx root document. */
	rootView?: InertiaRootView;
};

type Config = {
	app: AppConfig;
	session: SessionConfig;
	auth: AuthConfig;
	database: DatabaseConfig;
	cors: CorsConfig;
	csrf: CsrfTokenConfig;
	middlewares: MiddlewaresConfig;
	// eventListener: Events;
	// queue: QueueConfig;
	socialAuth?: SocialAuth;
	r2: R2Config;
	inertia?: InertiaConfig;
};

export {
	MiddlewareAliasType,
	AppConfig,
	SessionConfig,
	AuthConfig,
	Config,
	DatabaseConfig,
	CorsConfig,
	CsrfTokenConfig,
	MiddlewaresConfig,
	Events,
	QueueConfig,
};
