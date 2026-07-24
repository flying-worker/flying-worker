import { describe, it, expect, beforeEach } from "vitest";
import { Route } from "../../route";
import { createBootstrap } from "../bootstrap";
import { makeConfig } from "./helpers";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("#2 createBootstrap: memoized & atomic boot", () => {
	beforeEach(() => Route.reset());

	it("boots exactly once under a burst of concurrent first requests", async () => {
		let bootCount = 0;

		const server = createBootstrap({
			loadConfig: async () => {
				bootCount++;
				await wait(10); // widen the race window
				return makeConfig({
					webRoute: () => {
						Route.get("/", (c) => c.text("ok"));
					},
				});
			},
		});

		const results = await Promise.all(
			Array.from({ length: 5 }, () =>
				server.fetch(new Request("http://x/"), {}, {}),
			),
		);

		for (const res of results) expect(res.status).toBe(200);
		expect(bootCount).toBe(1); // memoized — not booted 5 times
	});

	it("returns 500 on boot failure and retries cleanly on the next request", async () => {
		let attempt = 0;

		const server = createBootstrap({
			loadConfig: async () => {
				attempt++;
				if (attempt === 1) throw new Error("bad config");
				return makeConfig({
					webRoute: () => {
						Route.get("/", (c) => c.text("ok"));
					},
				});
			},
		});

		const first = await server.fetch(new Request("http://x/"), {}, {});
		expect(first.status).toBe(500); // failed boot → 500, not a crash

		const second = await server.fetch(new Request("http://x/"), {}, {});
		expect(second.status).toBe(200); // promise was reset → clean retry
		expect(await second.text()).toBe("ok");
		expect(attempt).toBe(2);
	});
});
