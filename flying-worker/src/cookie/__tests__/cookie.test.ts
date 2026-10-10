import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import { Cookie, parseLifetime } from "../index";
import type { Config } from "../../type-declaration";

function makeConfig(): Config {
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
			driver: "cookie",
			cookie_name: "fw_session",
			lifetime: 120,
			path: "/",
			secure: true,
			httpOnly: true,
			sameSite: "Lax",
		},
	} as unknown as Config;
}

describe("parseLifetime", () => {
	it.each([
		["30s", 30],
		["30m", 1800],
		["2h", 7200],
		["3d", 259200],
	])("converts %s", (input, expected) => {
		expect(parseLifetime(input)).toBe(expected);
	});

	it("rejects a malformed duration", () => {
		expect(() => parseLifetime("30")).toThrow(/Invalid duration format/);
		expect(() => parseLifetime("30w")).toThrow(/Invalid duration format/);
		expect(() => parseLifetime("")).toThrow(/Invalid duration format/);
	});
});

describe("Cookie", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();
	});

	/** Extract a single cookie pair from a Set-Cookie header, for replay. */
	function pair(res: Response, name: string): string {
		const raw = res.headers.get("set-cookie") ?? "";
		const match = raw.match(new RegExp(`${name}=([^;,]*)`));
		return match ? `${name}=${match[1]}` : "";
	}

	it("round-trips a signed cookie", async () => {
		App.hono.get("/set", async (c) => {
			await Cookie.set("token", "abc123", "1h");
			return c.text("set");
		});
		App.hono.get("/get", async (c) => c.text(String(await Cookie.get("token"))));

		const setRes = await App.hono.request("/set");
		const cookie = pair(setRes, "token");

		const getRes = await App.hono.request("/get", { headers: { cookie } });
		expect(await getRes.text()).toBe("abc123");
	});

	it("applies the session config defaults to a signed cookie", async () => {
		App.hono.get("/set", async (c) => {
			await Cookie.set("token", "abc123", "1h");
			return c.text("set");
		});

		const header = (await App.hono.request("/set")).headers.get("set-cookie") ?? "";

		expect(header).toContain("HttpOnly");
		expect(header).toContain("Secure");
		expect(header).toContain("SameSite=Lax");
		expect(header).toContain("Max-Age=3600");
	});

	it("returns undefined and warns when a signed cookie is re-signed with the wrong value", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		App.hono.get("/set-a", async (c) => {
			await Cookie.set("token", "value-a");
			return c.text("set");
		});
		App.hono.get("/set-b", async (c) => {
			await Cookie.set("token", "value-b");
			return c.text("set");
		});
		App.hono.get("/get", async (c) => c.text(String(await Cookie.get("token"))));

		// Take the signature from one value and bolt it onto another: well-formed,
		// so it reaches signature verification rather than being discarded as
		// malformed. This is the case the warning in Cookie.get exists for.
		const a = pair(await App.hono.request("/set-a"), "token");
		const b = pair(await App.hono.request("/set-b"), "token");
		const forged = `token=value-a.${b.split(".")[1]}`;

		expect(a).not.toBe(b);

		const res = await App.hono.request("/get", { headers: { cookie: forged } });

		expect(await res.text()).toBe("undefined");
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("returns undefined for a malformed signed cookie without warning", async () => {
		// Hono discards a value it cannot even parse as signed, so Cookie.get
		// never sees `false` and the tamper warning does not fire here.
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		App.hono.get("/get", async (c) => c.text(String(await Cookie.get("token"))));

		const res = await App.hono.request("/get", {
			headers: { cookie: "token=not-a-signed-value" },
		});

		expect(await res.text()).toBe("undefined");
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it("returns undefined for a missing cookie", async () => {
		App.hono.get("/get", async (c) => c.text(String(await Cookie.get("nope"))));

		expect(await (await App.hono.request("/get")).text()).toBe("undefined");
	});

	it("sets an unsigned cookie readable without the secret", async () => {
		App.hono.get("/set", (c) => {
			Cookie.setUnsigned("csrf", "plain-value", { maxAge: 60 });
			return c.text("set");
		});
		App.hono.get("/get", (c) => c.text(String(Cookie.getUnsigned("csrf"))));

		const setRes = await App.hono.request("/set");
		const header = setRes.headers.get("set-cookie") ?? "";
		expect(header).toContain("csrf=plain-value");
		expect(header).not.toContain("HttpOnly");

		const getRes = await App.hono.request("/get", {
			headers: { cookie: pair(setRes, "csrf") },
		});
		expect(await getRes.text()).toBe("plain-value");
	});

	it("expires a cookie on delete", async () => {
		App.hono.get("/del", (c) => {
			Cookie.delete("token");
			return c.text("gone");
		});

		const header = (await App.hono.request("/del")).headers.get("set-cookie") ?? "";

		expect(header).toContain("token=");
		expect(header).toMatch(/Max-Age=0|Expires=/);
	});

	it("omits Max-Age when no lifetime is given, making it a session cookie", async () => {
		App.hono.get("/set", async (c) => {
			await Cookie.set("token", "abc123");
			return c.text("set");
		});

		const header = (await App.hono.request("/set")).headers.get("set-cookie") ?? "";

		expect(header).toContain("token=");
		expect(header).not.toContain("Max-Age");
	});
});
