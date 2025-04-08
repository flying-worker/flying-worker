import type { Context, Next } from "hono";
import { type ServerBuild, createRequestHandler } from "react-router";
import BaseMiddleware from "../core/abstraction/BaseMiddleware";

abstract class ReactRouter extends BaseMiddleware {
	protected abstract getServerBuild(): Promise<unknown>;

	public async boot(context: Context, next: Next) {
		const build = await this.getServerBuild();
		const requestHandler = createRequestHandler(
			build as unknown as ServerBuild,
		);

		return await requestHandler(context.req.raw);
	}
}

export default ReactRouter;
