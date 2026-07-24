import type * as schema from "../app/models";

/**
 * Register the app's Drizzle schema with the framework so `DB()` is fully typed.
 * This is the one-time hook that lets the schema-agnostic framework infer the
 * concrete tables/relations of this application.
 */
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace FlyingWorker {
		interface Database {
			schema: typeof schema;
		}
	}
}

export {};
