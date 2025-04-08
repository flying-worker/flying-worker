import { Context, Next } from "hono";
import BaseMiddleware from "../src/core/abstraction/BaseMiddleware";

class TestMiddleware extends BaseMiddleware {
	public async boot(context: Context, next: Next) {
		return context.json({
			data: "Protected by middleware",
		});
	}
}

export default TestMiddleware;
