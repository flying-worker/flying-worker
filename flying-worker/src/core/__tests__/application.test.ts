import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { Application } from "../Application";
import { Route } from "../../route";
import BaseMiddleware from "../abstraction/BaseMiddleware";
import { makeConfig } from "./helpers";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Hono's request() may return Response | Promise<Response>; normalize to text.
const readText = (res: Response | Promise<Response>): Promise<string> =>
	Promise.resolve(res).then((r) => r.text());

describe("#1 per-request state isolation (AsyncLocalStorage)", () => {
	it("does not leak currentState between concurrent, interleaved requests", async () => {
		const app = new Application();
		app.hono = new Hono();
		app.basicInit();

		app.hono.get("/whoami", async (c) => {
			const user = c.req.query("user")!;
			app.addToCurrentState("authUser", user);
			// A longer delay forces this request to yield while the other runs;
			// it must still read back its OWN user, not the interleaved one.
			await wait(Number(c.req.query("delay") ?? 0));
			return c.text(String(app.getCurrentState("authUser")));
		});

		const [alice, bob] = await Promise.all([
			readText(app.hono.request("/whoami?user=alice&delay=25")),
			readText(app.hono.request("/whoami?user=bob&delay=1")),
		]);

		expect(alice).toBe("alice");
		expect(bob).toBe("bob");
	});

	it("binds getContext() to the correct request under concurrency", async () => {
		const app = new Application();
		app.hono = new Hono();
		app.basicInit();

		app.hono.get("/ctx", async (c) => {
			const before = app.getContext().req.query("id");
			await wait(Number(c.req.query("delay") ?? 0));
			const after = app.getContext().req.query("id");
			return c.text(`${before}:${after}`);
		});

		const [a, b] = await Promise.all([
			readText(app.hono.request("/ctx?id=A&delay=25")),
			readText(app.hono.request("/ctx?id=B&delay=1")),
		]);

		expect(a).toBe("A:A");
		expect(b).toBe("B:B");
	});
});

describe("#3 route-specific middleware is applied (no auth bypass)", () => {
	beforeEach(() => Route.reset());

	it("runs a route's guard middleware and lets it block the request", async () => {
		const calls: string[] = [];

		class AuthGuard extends BaseMiddleware {
			async boot(c: Parameters<BaseMiddleware["boot"]>[0]) {
				calls.push("guard");
				return c.text("forbidden", 403);
			}
		}

		const app = new Application();
		const config = makeConfig({
			aliases: { auth: AuthGuard },
			webRoute: () => {
				Route.get("/admin", (c) => c.text("secret"), ["auth"]);
			},
		});

		await app.boot(new Hono(), config);

		const res = await app.hono.request("/admin");

		expect(calls).toContain("guard"); // middleware actually ran
		expect(res.status).toBe(403); // and was able to block
		expect(await res.text()).toBe("forbidden"); // handler ("secret") never reached
	});

	it("throws a clear error for an unregistered middleware alias", async () => {
		const app = new Application();
		const config = makeConfig({
			aliases: {},
			webRoute: () => {
				Route.get("/x", (c) => c.text("ok"), ["missing"]);
			},
		});

		await expect(app.boot(new Hono(), config)).rejects.toThrow(/not registered/);
	});
});
