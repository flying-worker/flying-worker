import type { DrizzleD1Database } from "drizzle-orm/d1";
import { App, AppRequest } from "../core";

/**
 * Schema registry.
 *
 * The framework is schema-agnostic (it ships as a package and can't know the
 * consuming app's tables at build time). The app registers its schema **once**
 * via declaration merging, e.g.:
 *
 * ```ts
 * // app-side, e.g. example/types/database.d.ts
 * import type * as schema from "../app/models";
 * declare global {
 *   namespace FlyingWorker {
 *     interface Database { schema: typeof schema }
 *   }
 * }
 * export {};
 * ```
 *
 * After that, `DB()` is fully typed everywhere — `DB().query.users.findFirst(...)`,
 * `DB().select().from(users)`, etc. — with autocomplete and column checks.
 */
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace FlyingWorker {
		// Augmented by the app to `{ schema: typeof schema }`.
		interface Database {}
	}
}

type RegisteredSchema = FlyingWorker.Database extends { schema: infer S }
	? S extends Record<string, unknown>
		? S
		: Record<string, never>
	: Record<string, never>;

/** The application's Drizzle client type, inferred from the registered schema. */
export type AppDatabase = DrizzleD1Database<RegisteredSchema>;

/**
 * Resolve the Drizzle database client for the given connection (defaults to
 * `App.config.database.default`).
 *
 * The client is created once per request and cached on the Hono context, so
 * repeated `DB()` calls within a request reuse the same instance.
 */
export function DB(connection?: string): AppDatabase {
	const config = App.config.database;
	if (!config) {
		throw new Error(
			"Database is not configured. Add `database` to your config (example/config/index.ts) " +
				"and make sure a D1 binding exists in wrangler.jsonc.",
		);
	}

	const type = connection || config.default;
	const conn = config.connections[type];
	if (!conn) {
		throw new Error(
			`Unsupported database connection: "${type}". ` +
				`Available: ${Object.keys(config.connections).join(", ") || "(none)"}.`,
		);
	}

	// Per-request cache keyed on the connection name. Falls back to an
	// uncached client when no request context is available.
	const cacheKey = `flying-worker:db:${type}`;
	const ctx = tryGetContext();
	if (ctx) {
		const cached = ctx.get(cacheKey) as AppDatabase | undefined;
		if (cached) return cached;
	}

	const instance = conn.connection() as AppDatabase;
	if (ctx) ctx.set(cacheKey, instance);
	return instance;
}

/** Return the current Hono context if one is available, else undefined. */
function tryGetContext() {
	try {
		return AppRequest.getContext();
	} catch {
		return undefined;
	}
}
