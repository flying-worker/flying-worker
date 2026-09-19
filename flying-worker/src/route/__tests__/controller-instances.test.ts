import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import Route from "../Route";
import { makeConfig } from "../../core/__tests__/helpers";

/**
 * Regression cover for: controllers were module-level singletons.
 *
 * `add()` ran `new ClassRef()` at registration time, so one instance served
 * every request in the isolate. A controller storing per-request data on
 * `this` — the natural Laravel habit — leaked it into concurrent requests.
 */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Hono's request() may return Response | Promise<Response>; normalize to text.
const readText = (res: Response | Promise<Response>): Promise<string> =>
	Promise.resolve(res).then((r) => r.text());

let constructed = 0;

class ProfileController {
	private user = "";

	constructor() {
		constructed++;
	}

	async show(c: any) {
		this.user = c.req.query("user");
		// Yield so the other in-flight request runs before this one reads back.
		await wait(Number(c.req.query("delay") ?? 0));
		return c.text(this.user);
	}
}

describe("class-based route handlers", () => {
	beforeEach(async () => {
		constructed = 0;
		Route.reset();
		App.hono = new Hono();
		App.loadConfig(
			makeConfig({ webRoute: () => Route.get("/profile", [ProfileController, "show"]) }),
		);
		await App.boot(App.hono, App.config);
	});

	it("does not leak per-request state between concurrent requests", async () => {
		const [alice, bob] = await Promise.all([
			readText(App.hono.request("/profile?user=alice&delay=25")),
			readText(App.hono.request("/profile?user=bob&delay=1")),
		]);

		expect(alice).toBe("alice");
		expect(bob).toBe("bob");
	});

	it("constructs the controller per request, not at registration", async () => {
		expect(constructed).toBe(0);

		await App.hono.request("/profile?user=a");
		await App.hono.request("/profile?user=b");

		expect(constructed).toBe(2);
	});
});
