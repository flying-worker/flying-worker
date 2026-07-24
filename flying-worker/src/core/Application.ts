import { AsyncLocalStorage } from "node:async_hooks";
import { Context, Hono, Next } from "hono";
import { Route } from "../route";

import {
	AuthenticatedUser,
	Config,
	MiddlewareClass,
	MiddlewareInstance,
} from "../type-declaration";
import { setEnv } from "./request";
import { Container } from "./container";

const middlewareInstances = new Map<MiddlewareClass, MiddlewareInstance>();

type CurrentStates = {
	authUser?: AuthenticatedUser | null;
	[key: string]: unknown;
};

/**
 * Per-request state. Held in an AsyncLocalStorage store (not on the singleton)
 * so concurrent requests sharing one Worker isolate can never read each other's
 * context, container, or auth state.
 */
type RequestState = {
	context: Context;
	container: Container;
	currentStates: CurrentStates;
};

const requestStore = new AsyncLocalStorage<RequestState>();

class Application {
	public hono!: Hono;
	public config!: Config;

	constructor() {}

	public async boot(app: Hono, config: Config, queue = false) {
		this.config = config;
		this.hono = app;

		if (Object.keys(this.config.app).length === 0) {
			throw new Error("App Configuration not set");
		}

		if (queue) {
			return;
		}

		this.basicInit();

		this.activeGlobalMiddleware();

		this.activeApiMiddleware();

		this.activeWebMiddleware();

		await this.initiateHonoRoute();

		this.activePoweredByMiddleware();
	}

	loadConfig(config: Config) {
		this.config = config;
	}

	/** The active request's Hono context (throws if called outside a request). */
	getContext(): Context {
		const store = requestStore.getStore();
		if (!store) {
			throw new Error("No active request context (called outside a request scope)");
		}
		return store.context;
	}

	/** The active request's DI container (throws if called outside a request). */
	getContainer(): Container {
		const store = requestStore.getStore();
		if (!store) {
			throw new Error("No active request container (called outside a request scope)");
		}
		return store.container;
	}

	addToCurrentState(key: string, value: unknown) {
		const store = requestStore.getStore();
		if (store) {
			store.currentStates[key] = value;
		}
	}

	getCurrentState(key: string): any {
		const store = requestStore.getStore();
		return store?.currentStates[key] ?? "";
	}

	public basicInit() {
		// First middleware in the chain: open a fresh per-request store and run
		// the rest of the request inside it, so every downstream middleware and
		// handler resolves the correct context/container via AsyncLocalStorage.
		this.hono.use("*", (context: Context, next: Next) => {
			const store: RequestState = {
				context,
				container: new Container(),
				currentStates: {},
			};

			return requestStore.run(store, () => next());
		});
	}

	public setEnv(env: Record<string, unknown>) {
		setEnv(env);
	}

	private resolveRouteMiddlewares(aliases: string[]) {
		const registered = this.config.middlewares.aliases ?? {};

		return aliases.map((alias) => {
			const MiddlewareRef = registered[alias];

			if (!MiddlewareRef) {
				throw new Error(
					`Route middleware "${alias}" is not registered. ` +
						`Add it to config.middlewares.aliases.`,
				);
			}

			const instance = new MiddlewareRef();
			return instance.boot.bind(instance);
		});
	}

	private applyRoutes(prefix: string | null = null) {
		for (const route of Route.getRoutes()) {
			const { method, path, handler, middlewares } = route;
			let finalPath = path;

			if (prefix) {
				finalPath = `${prefix}/${finalPath}`;
			}

			if (finalPath.length > 1) {
				finalPath = finalPath.replace(/\/+/g, "/").replace(/\/$/, "");
			}

			// Resolve and apply route-specific middlewares before the handler,
			// so guards declared like Route.get(path, handler, ["auth"]) run.
			const middlewareHandlers = this.resolveRouteMiddlewares(middlewares);

			// Hono's per-method generics don't model a dynamic method name + a
			// spread of handlers; call with a permissive signature while keeping
			// the Hono `this` binding.
			const register = this.hono[method as "get"] as (
				path: string,
				...handlers: unknown[]
			) => unknown;
			register.call(this.hono, finalPath, ...middlewareHandlers, handler);
		}
	}

	private async initiateHonoRoute() {
		await this.config.app.webRoute();

		this.applyRoutes();

		Route.reset();

		await this.config.app.apiRoute();

		this.applyRoutes(this.config.app.apiPrefix);
	}

	private activePoweredByMiddleware() {
		this.hono.use(async (context: Context, next: Next) => {
			await next();
			context.res.headers.set(
				"X-Powered-By",
				"FlyingWorker Framework for Cloudflare Worker/Page with Hono, Remix",
			);
		});
	}

	private activeGlobalMiddleware() {
		for (const middleware of this.config.middlewares.global) {
			const middlewareInstance = new middleware();
			this.hono.use(middlewareInstance.boot.bind(middlewareInstance));
		}
	}

	private activeWebMiddleware() {
		for (const middleware of this.config.middlewares.web) {
			const middlewareInstance = new middleware();
			this.hono.use(middlewareInstance.boot.bind(middlewareInstance));
		}
	}

	private activeApiMiddleware() {
		const apiPrefix = this.config.app.apiPrefix?.replace(/^\/+|\/+$/g, "") || "api";
		for (const middleware of this.config.middlewares.api) {
			const middlewareInstance = new middleware();
			this.hono.use(`/${apiPrefix}/*`, middlewareInstance.boot.bind(middlewareInstance));
		}
	}
}

let App = new Application();

export default App;
export { Application };
