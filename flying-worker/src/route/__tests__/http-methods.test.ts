import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import Route from "../Route";
import { makeConfig } from "../../core/__tests__/helpers";

/**
 * Cover for the verbs the Route helper registers.
 *
 * `HttpMethod` has always listed patch/options, but RouteManager only
 * implemented get/post/put/delete/all — PATCH routes could not be registered
 * through the helper at all.
 */

describe("Route HTTP methods", () => {
	beforeEach(async () => {
		Route.reset();
		App.hono = new Hono();
		App.loadConfig(
			makeConfig({
				webRoute: () => {
					Route.get("/thing", (c) => c.text("get"));
					Route.post("/thing", (c) => c.text("post"));
					Route.put("/thing", (c) => c.text("put"));
					Route.patch("/thing", (c) => c.text("patch"));
					Route.delete("/thing", (c) => c.text("delete"));
					Route.options("/thing", (c) => c.text("options"));
				},
			}),
		);
		await App.boot(App.hono, App.config);
	});

	it.each([
		["GET", "get"],
		["POST", "post"],
		["PUT", "put"],
		["PATCH", "patch"],
		["DELETE", "delete"],
		["OPTIONS", "options"],
	])("routes %s", async (method, expected) => {
		const res = await App.hono.request("/thing", { method });

		expect(res.status).toBe(200);
		expect(await res.text()).toBe(expected);
	});

	it("answers HEAD from the GET route, with the body stripped", async () => {
		// Hono has no head() shortcut and on('HEAD', ...) registers nothing —
		// HEAD is served by the matching GET route. Documented by this test so
		// nobody adds a Route.head() that silently never matches.
		const res = await App.hono.request("/thing", { method: "HEAD" });

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("");
	});

	it("applies route middleware to a PATCH route", async () => {
		Route.reset();
		App.hono = new Hono();
		App.loadConfig(
			makeConfig({
				aliases: {
					stamp: class {
						async boot(c: any, next: any) {
							await next();
							c.res.headers.set("X-Stamped", "yes");
						}
					} as any,
				},
				webRoute: () => Route.patch("/thing", (c) => c.text("patch"), ["stamp"]),
			}),
		);
		await App.boot(App.hono, App.config);

		const res = await App.hono.request("/thing", { method: "PATCH" });

		expect(await res.text()).toBe("patch");
		expect(res.headers.get("X-Stamped")).toBe("yes");
	});
});
