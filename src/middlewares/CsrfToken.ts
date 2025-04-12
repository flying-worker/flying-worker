import type { Context, Next } from "hono";
import { Cookie } from "../cookie";
import { App, Request } from "../core";
import BaseMiddleware from "../core/abstraction/BaseMiddleware";
import { encrypt } from "../supports/Encrypt";

export default class CsrfToken extends BaseMiddleware {
	protected isExceptPath = (path: string) => {
		return App.config.csrf.except.some((pattern) => {
			if (pattern.endsWith("*")) {
				return path.startsWith(pattern.slice(0, -1));
			}

			return path === pattern;
		});
	};

	public async boot(context: Context, next: Next) {
		let tokenSuccess = true;

		if (
			!context.req.path.startsWith("api") &&
			!this.isExceptPath(context.req.path)
		) {
			if (["POST", "PUT", "DELETE", "PATCH"].includes(context.req.method)) {
				let csrfToken = context.req.header("X-CSRF-TOKEN");
				if (!csrfToken) {
					csrfToken = Request.input("csrf_token");
				}

				const tokenFromCookie = await Cookie.get("X-CSRF-TOKEN");

				if (csrfToken && tokenFromCookie) {
					if (tokenFromCookie !== csrfToken) {
						tokenSuccess = false;
					}
				} else {
					tokenSuccess = false;
				}
			}
		}

		const now = (Date.now() / 1e3) | 0;

		const newToken = await encrypt(now);

		Cookie.set("X-CSRF-TOKEN", newToken);

		App.addToCurrentState("csrfToken", newToken);

		if (!tokenSuccess) {
			return context.json({ error: "CSRF token mismatch" }, 403);
		}

		await next();
	}
}
