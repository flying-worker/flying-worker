import { ExecutionContext } from "@cloudflare/workers-types";
import type { MessageBatch } from "@cloudflare/workers-types";
import Application from "./bootstrap/App";
import { Env } from "./types/declarations";
import {Event} from "./src/event";

export default {
	fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
		return await Application.boot(request, env, ctx);
	},

	async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext) {

		await Application.bootQueue(env, ctx);

		for (const message of batch.messages) {

			await Event.dispatch(message.body.event, ...message.body.payload).process()

		}
	},
};
