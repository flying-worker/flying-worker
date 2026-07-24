import { Hono } from "hono";
import App from "./Application";
import type { Config } from "../type-declaration";

export interface BootstrapOptions {
	/** Load the app config (e.g. `() => import("../config").then(m => m.default)`). */
	loadConfig: () => Config | Promise<Config>;
	/** Hook to configure the Hono instance before boot (e.g. `app.use(renderer)`). */
	onCreate?: (app: Hono) => void | Promise<void>;
}

export interface WorkerServer {
	fetch: (
		request: Request,
		env: Record<string, unknown>,
		ctx: unknown,
	) => Promise<Response>;
	queue: (
		batch: unknown,
		env: Record<string, unknown>,
		ctx: unknown,
	) => Promise<void>;
}

/**
 * Build the Cloudflare Worker handler.
 *
 * Boot happens exactly once per isolate and is:
 *  - memoized on a single in-flight promise, so a burst of concurrent first
 *    requests never double-registers routes/middleware;
 *  - atomic — the booted Hono app is only published after boot succeeds, so a
 *    failed boot never leaves a half-configured app serving traffic;
 *  - self-healing — a failed boot resets the promise so the next request retries.
 */
export function createBootstrap(options: BootstrapOptions): WorkerServer {
	let bootPromise: Promise<Hono> | null = null;

	const init = (): Promise<Hono> => {
		if (bootPromise) {
			return bootPromise;
		}

		const pending = (async () => {
			const config = await options.loadConfig();
			const app = new Hono();
			await options.onCreate?.(app);
			await App.boot(app, config);
			return app;
		})();

		// Reset on failure so a later request can retry a clean boot instead of
		// being stuck with a rejected/half-booted instance.
		pending.catch(() => {
			if (bootPromise === pending) {
				bootPromise = null;
			}
		});

		bootPromise = pending;
		return pending;
	};

	return {
		fetch: async (request, env, ctx) => {
			App.setEnv(env);
			try {
				const app = await init();
				return app.fetch(request, env as never, ctx as never);
			} catch (error) {
				console.error("[flying-worker] Application failed to initialize:", error);
				return new Response("Application failed to initialize", { status: 500 });
			}
		},
		queue: async (_batch, env) => {
			App.setEnv(env);
			// Ensure the app is booted so queue handlers can use framework services.
			await init();
		},
	};
}
