import type { Context, Next } from "hono";
import { workerKVSession } from "remix-hono/cloudflare";
import { Cookie } from "../cookie";
import { App } from "../core";
import BaseMiddleware from "../core/abstraction/BaseMiddleware";

export default class Session extends BaseMiddleware {
	protected isAvoidPath = (path: string) => {
		return App.config.session.avoidPath.some((pattern) => {
			if (pattern.endsWith("*")) {
				return path.startsWith(pattern.slice(0, -1));
			}

			return path === pattern; // Exact match for paths like 'product/'
		});
	};

	public async boot(context: Context, next: Next) {
		if (!this.isAvoidPath(context.req.path)) {
			const secret = App.config.app.secret;

			// ensure remember me token
			const rememberLogin: string | undefined | false =
				await Cookie.get("remember_login");
			if (rememberLogin) {
				Cookie.set("remember_login", rememberLogin, "30d");
			}

			return await workerKVSession({
				autoCommit: true,
				cookie: {
					name: App.config.session.cookie,
					secrets() {
						return [secret];
					},
					secure: App.config.session.secure,
					domain: App.config.session.domain,
					httpOnly: App.config.session.httpOnly,
					sameSite: App.config.session.sameSite,
					path: App.config.session.path,
					maxAge: rememberLogin
						? 30 * 24 * 60 * 60
						: App.config.session.lifetime * 60,
				},
				binding: App.config.session.driver,
			})(context, next);
		}
	}
}
