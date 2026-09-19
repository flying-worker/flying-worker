import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import { Session, sessionMiddleware } from "../index";
import type { Config } from "../../type-declaration";

function makeKv() {
	const store = new Map<string, string>();
	const writes: string[] = [];
	return {
		store,
		writes,
		get: async (key: string) => store.get(key) ?? null,
		put: async (key: string, value: string) => {
			writes.push(key);
			store.set(key, value);
		},
		delete: async (key: string) => void store.delete(key),
	};
}

function makeConfig(driver: "kv" | "cookie"): Config {
	return {
		app: {
			name: "test",
			secret: "test-secret-value",
			environment: "test",
			url: "http://localhost",
			timezone: "UTC",
			locale: "en",
			maintenance: { status: false, message: "" },
			apiPrefix: "api",
			webRoute: async () => {},
			apiRoute: async () => {},
		},
		middlewares: { global: [], web: [], api: [], reactRouter: [], aliases: {} },
		session: {
			driver,
			cookie_name: "fw_session",
			lifetime: 120,
			path: "/",
			secure: false,
			httpOnly: true,
			sameSite: "Lax",
		},
	} as unknown as Config;
}

function cookieFrom(res: Response): string {
	const raw = res.headers.get("set-cookie") ?? "";
	const match = raw.match(/fw_session=([^;,]*)/);
	return match ? `fw_session=${match[1]}` : "";
}

describe("SessionStore", () => {
	let kv: ReturnType<typeof makeKv>;

	beforeEach(() => {
		kv = makeKv();
		App.hono = new Hono();
		App.loadConfig(makeConfig("kv"));
		App.basicInit();
		App.hono.use(sessionMiddleware);
	});

	const env = () => ({ kv });

	it("persists a value across requests", async () => {
		App.hono.get("/put", (c) => {
			Session.put("cart", { items: 2 });
			return c.text("ok");
		});
		App.hono.get("/get", (c) => c.json(Session.get("cart")));

		const cookie = cookieFrom(await App.hono.request("/put", {}, env()));
		const res = await App.hono.request("/get", { headers: { cookie } }, env());

		expect(await res.json()).toEqual({ items: 2 });
	});

	it("returns the default for a missing key", async () => {
		App.hono.get("/get", (c) => c.text(String(Session.get("nope", "fallback"))));

		expect(await (await App.hono.request("/get", {}, env())).text()).toBe("fallback");
	});

	it("reports presence with has() and removes with forget()", async () => {
		App.hono.get("/probe", (c) => {
			Session.put("a", 1);
			const before = Session.has("a");
			Session.forget("a");
			return c.json({ before, after: Session.has("a") });
		});

		const res = await App.hono.request("/probe", {}, env());
		expect(await res.json()).toEqual({ before: true, after: false });
	});

	it("clears everything with flush()", async () => {
		App.hono.get("/probe", (c) => {
			Session.put("a", 1);
			Session.put("b", 2);
			Session.flush();
			return c.json(Session.all());
		});

		expect(await (await App.hono.request("/probe", {}, env())).json()).toEqual({});
	});

	it("skips the KV write when nothing changed", async () => {
		App.hono.get("/read-only", (c) => c.text(String(Session.get("anything", "none"))));

		await App.hono.request("/read-only", {}, env());

		// isDirty is false, so save() must not touch KV — this is what keeps a
		// plain GET from costing a write on every hit.
		expect(kv.writes).toHaveLength(0);
	});

	it("writes to KV when something changed", async () => {
		App.hono.get("/write", (c) => {
			Session.put("a", 1);
			return c.text("ok");
		});

		await App.hono.request("/write", {}, env());

		expect(kv.writes.filter((k) => k.startsWith("session:"))).toHaveLength(1);
	});

	it("throws a clear error when the middleware is missing", async () => {
		App.hono = new Hono();
		App.loadConfig(makeConfig("kv"));
		App.basicInit();
		App.hono.get("/put", (c) => {
			try {
				Session.put("a", 1);
				return c.text("no throw");
			} catch (error) {
				return c.text((error as Error).message);
			}
		});

		const res = await App.hono.request("/put", {}, env());
		expect(await res.text()).toMatch(/Session not initialized/);
	});
});

describe("flash data", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig("cookie"));
		App.basicInit();
		App.hono.use(sessionMiddleware);

		App.hono.get("/flash", (c) => {
			Session.flash("status", "Saved!");
			return c.text("flashed");
		});
		App.hono.get("/read", (c) => c.text(String(Session.get("status", "gone"))));
		App.hono.get("/ignore", (c) => c.text("ignored"));
		App.hono.get("/all", (c) => c.json(Session.all()));
	});

	it("is readable by its plain key on the next request", async () => {
		const cookie = cookieFrom(await App.hono.request("/flash"));
		const res = await App.hono.request("/read", { headers: { cookie } });

		expect(await res.text()).toBe("Saved!");
	});

	it("survives exactly one request, even when never read", async () => {
		const flashed = cookieFrom(await App.hono.request("/flash"));

		// A request that does not read the flash still expires it.
		const afterIgnore = cookieFrom(
			await App.hono.request("/ignore", { headers: { cookie: flashed } }),
		);

		const res = await App.hono.request("/read", { headers: { cookie: afterIgnore } });
		expect(await res.text()).toBe("gone");
	});

	it("is not exposed under its internal prefix by all()", async () => {
		const cookie = cookieFrom(await App.hono.request("/flash"));
		const body = (await (
			await App.hono.request("/all", { headers: { cookie } })
		).json()) as Record<string, unknown>;

		expect(body).toEqual({ status: "Saved!" });
	});
});
