import { ExecutionContext } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { App } from "../src/core";
import { Env } from "../types/declarations";

let honoApp: Hono;

const initApp = async (queue = false) => {
	const config = await import("../config");

	await App.boot(config.default, queue);

	honoApp = App.hono;
};

export default {
	boot: async (request: Request, env: Env, ctx: ExecutionContext) => {
		App.setRequest(request);

		if (!honoApp) {
			App.setEnv(env);

			await initApp();
		}

		return honoApp.fetch(request, env, ctx);
	},
	bootQueue: async (env: Env, ctx: ExecutionContext) => {
		if (!honoApp) {
			App.setEnv(env);

			await initApp(true);
		}
	},
};
