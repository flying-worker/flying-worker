import { ExecutionContext } from "@cloudflare/workers-types";
import type { MessageBatch } from "@cloudflare/workers-types";
import Application from "./bootstrap/App";
import { Env } from "./types/declarations";

export default {
	fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
		return await Application.boot(request, env, ctx);
	},
	queue: async (batch: MessageBatch, env: Env) => {
		for (let message of batch.messages) {
		}

		// for (const message of batch.messages) {
		// 	// need to implement
		// 	console.log(message, "messagess")
		// }
	},
};
