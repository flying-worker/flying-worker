import { type Table, type TableConfig } from "drizzle-orm";
import { Column, ColumnBaseConfig } from "drizzle-orm";
import { Context } from "hono";
import BaseMiddleware from "../core/abstraction/BaseMiddleware";
import BaseListener from "../event/BaseListener";

type UserModelConstraint = Table<TableConfig> & {
	id: Column<ColumnBaseConfig<"number", string>>;
	email: Column<ColumnBaseConfig<"string", string>>;
	provider_name: Column<ColumnBaseConfig<"string", string>>;
	provider_id: Column<ColumnBaseConfig<"string", string>>;
	avatar: Column<ColumnBaseConfig<"string", string>>;
	remember_token: Column<ColumnBaseConfig<"string", string>>;
};

type RolePermissionModelConstraint = Table<TableConfig> & {
	id: Column<ColumnBaseConfig<"number", string>>;
	user_id: Column<ColumnBaseConfig<"number", string>>;
	role: Column<ColumnBaseConfig<"string", string>>;
	permissions: Column<ColumnBaseConfig<"string", string>>;
};

type TokenModelConstraint = Table<TableConfig> & {
	id: Column<ColumnBaseConfig<"number", string>>;
	user_id: Column<ColumnBaseConfig<"number", string>>;
	name: Column<ColumnBaseConfig<"string", string>>;
	token: Column<ColumnBaseConfig<"string", string>>;
	permissions: Column<ColumnBaseConfig<"string", string>>;
	expires_at: Column<ColumnBaseConfig<"string", string>>;
};

export interface SessionGuardConfig {
	driver: "session";
	userTable: string;
	rolePermissionTable: string;
}

interface UseCookie {
	status: boolean;
	maxAge: string | number;
	key: string;
}

export interface JwtGuardConfig {
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
	origin: string | string[] | ((origin: string, c: Context) => string); // array or string
	allowHeaders: string[];
	allowMethods: string[];
	exposeHeaders: string[];
	maxAge: number;
	credentials: boolean;
}

interface CsrfTokenConfig {
	origin: "same" | string | string[]; // array or string
	except: string[];
}

type CallbackListener = (...args: any[]) => Promise<void> | void;
type ClassListener =
	| (new (
			...args: any[]
	  ) => BaseListener)[]
	| (new (
			...args: any[]
	  ) => BaseListener);

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
	maintenance: { status: boolean; message: string };
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
	lifetime: number; // in minute
	expireOnClose: boolean;
	lottery: [number, number]; // Tuple representing [probability, outOf]
	cookie: string;
	path: string;
	domain?: string; // Optional because it might be undefined
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

export {
	MiddlewareAliasType,
	AppConfig,
	SessionConfig,
	AuthConfig,
	Config,
	DatabaseConfig,
	RolePermissionModelConstraint,
	CorsConfig,
	CsrfTokenConfig,
	MiddlewaresConfig,
	Events,
	QueueConfig,
};
