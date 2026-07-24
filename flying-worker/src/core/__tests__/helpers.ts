import type { Config } from "../../type-declaration";
import type BaseMiddleware from "../abstraction/BaseMiddleware";

type MiddlewareClass = new () => BaseMiddleware;

/**
 * Build a minimal Config sufficient for Application.boot() in tests.
 * boot() only reads `app` and `middlewares`, so the rest is intentionally omitted.
 */
export function makeConfig(
	partial: {
		webRoute?: () => void | Promise<void>;
		apiRoute?: () => void | Promise<void>;
		aliases?: Record<string, MiddlewareClass>;
		global?: MiddlewareClass[];
		web?: MiddlewareClass[];
		api?: MiddlewareClass[];
		apiPrefix?: string;
	} = {},
): Config {
	return {
		app: {
			name: "test",
			secret: "test-secret",
			environment: "test",
			url: "http://localhost",
			timezone: "UTC",
			locale: "en",
			maintenance: { status: false, message: "" },
			apiPrefix: partial.apiPrefix ?? "api",
			webRoute: async () => {
				await partial.webRoute?.();
			},
			apiRoute: async () => {
				await partial.apiRoute?.();
			},
		},
		middlewares: {
			global: partial.global ?? [],
			web: partial.web ?? [],
			api: partial.api ?? [],
			reactRouter: [],
			aliases: partial.aliases ?? {},
		},
	} as unknown as Config;
}
