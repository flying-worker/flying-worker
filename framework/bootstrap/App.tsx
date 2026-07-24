import { createBootstrap } from "flying-worker/core";
import { renderer } from "flying-worker/renderer";

/**
 * Application bootstrap.
 *
 * `createBootstrap` returns the Cloudflare Worker handler ({ fetch, queue }).
 * Boot runs once per isolate: memoized, atomic (published only on success),
 * and self-healing on failure — see flying-worker/core.
 */
const server = createBootstrap({
	loadConfig: async () => (await import("../config")).default,
	onCreate: (app) => {
		app.use(renderer);
	},
});

export default server;
