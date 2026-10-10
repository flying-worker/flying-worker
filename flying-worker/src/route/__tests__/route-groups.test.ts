import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import Route from "../Route";
import BaseMiddleware from "../../core/abstraction/BaseMiddleware";
import { makeConfig } from "../../core/__tests__/helpers";
import type { Context, Next } from "hono";

/** Appends its label to X-Chain so ordering and accumulation are observable. */
function stamp(label: string) {
	return class extends BaseMiddleware {
		async boot(c: Context, next: Next) {
			await next();
			const existing = c.res.headers.get("X-Chain");
			c.res.headers.set("X-Chain", existing ? `${existing},${label}` : label);
		}
	};
}

describe("Route.group", () => {
	beforeEach(() => {
		Route.reset();
		App.hono = new Hono();
	});

	async function boot(webRoute: () => void, aliases = {}) {
		App.loadConfig(makeConfig({ webRoute, aliases }));
		await App.boot(App.hono, App.config);
	}

	it("prefixes the routes declared inside it", async () => {
		await boot(() => {
			Route.group("/admin", () => {
				Route.get("/dashboard", (c) => c.text("dashboard"));
			});
		});

		expect(await (await App.hono.request("/admin/dashboard")).text()).toBe("dashboard");
		expect((await App.hono.request("/dashboard")).status).toBe(404);
	});

	it("nests prefixes", async () => {
		await boot(() => {
			Route.group("/admin", () => {
				Route.group("/users", () => {
					Route.get("/list", (c) => c.text("list"));
				});
			});
		});

		expect(await (await App.hono.request("/admin/users/list")).text()).toBe("list");
	});

	it("restores the previous prefix after the group closes", async () => {
		await boot(() => {
			Route.group("/admin", () => {
				Route.get("/in", (c) => c.text("in"));
			});
			Route.get("/out", (c) => c.text("out"));
		});

		expect(await (await App.hono.request("/admin/in")).text()).toBe("in");
		expect(await (await App.hono.request("/out")).text()).toBe("out");
	});

	it("applies group middleware to routes inside it", async () => {
		await boot(
			() => {
				Route.group("/admin", () => {
					Route.get("/dashboard", (c) => c.text("dashboard"));
				}, ["auth"]);
				Route.get("/public", (c) => c.text("public"));
			},
			{ auth: stamp("auth") },
		);

		const guarded = await App.hono.request("/admin/dashboard");
		expect(guarded.headers.get("X-Chain")).toBe("auth");

		const open = await App.hono.request("/public");
		expect(open.headers.get("X-Chain")).toBeNull();
	});

	it("accumulates middleware from nested groups and the route itself", async () => {
		await boot(
			() => {
				Route.group("/admin", () => {
					Route.group("/users", () => {
						Route.get("/list", (c) => c.text("list"), ["route"]);
					}, ["inner"]);
				}, ["outer"]);
			},
			{ outer: stamp("outer"), inner: stamp("inner"), route: stamp("route") },
		);

		const res = await App.hono.request("/admin/users/list");

		// Stamped on the way out, so the header reads innermost-first.
		expect(res.headers.get("X-Chain")).toBe("route,inner,outer");
	});

	it("raises a clear error for an unregistered middleware alias", async () => {
		await expect(
			boot(() => {
				Route.get("/x", (c) => c.text("x"), ["nope"]);
			}),
		).rejects.toThrow(/Route middleware "nope" is not registered/);
	});
});
