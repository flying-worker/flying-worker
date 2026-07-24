import { ExecutionContext } from "@cloudflare/workers-types";
import { Env } from "./types/declarations";
import server from "./bootstrap/App";

export default {
	fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
		server.fetch(request, env as never, ctx),
	queue: (batch: unknown, env: Env, ctx: ExecutionContext) =>
		server.queue(batch, env as never, ctx),
};
