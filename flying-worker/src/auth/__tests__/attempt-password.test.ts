import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { Hono } from "hono";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import App from "../../core/Application";
import { Auth } from "../index";
import { sessionMiddleware } from "../../session";
import { passwordHash } from "../../supports";
import type { Config } from "../../type-declaration";

/**
 * Regression cover for: an empty password authenticated as any user.
 *
 * `attempt()` guarded password verification with `if (password)`, so `""`
 * skipped `passwordVerify` entirely and logged in whichever user matched the
 * remaining identifying columns.
 */

const users = sqliteTable("users", {
	id: integer("id").primaryKey(),
	name: text("name"),
	email: text("email"),
	password: text("password"),
});

let defaultUser: Record<string, unknown>;
let userRow: Record<string, unknown> | undefined;

/** Minimal stand-in for the Drizzle client: every query resolves to `userRow`. */
const fakeDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				get: async () => userRow,
				all: async () => (userRow ? [userRow] : []),
			}),
		}),
	}),
};

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
			secure: false,
			httpOnly: true,
			sameSite: "Lax",
		},
		database: {
			default: "d1",
			connections: { d1: { connection: () => fakeDb } },
		},
		auth: {
			defaultWebGuard: "web",
			defaultApiGuard: "api",
			guards: {
				web: { driver: "session", userTable: users },
				api: { driver: "jwt", useCookie: { status: false, key: "token", maxAge: "1h" } },
			},
		},
	} as unknown as Config;
}

/** Run `Auth.attempt(credentials)` inside a real request scope. */
async function attempt(credentials: Record<string, string>): Promise<string> {
	const res = await App.hono.request("/attempt", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(credentials),
	});
	return res.text();
}

describe("Auth.attempt() password handling", () => {
	beforeAll(async () => {
		defaultUser = {
			id: 1,
			name: "Victim",
			email: "victim@example.com",
			password: await passwordHash("correct-horse"),
		};
	});

	beforeEach(() => {
		// Reset per test so one case's row can never leak into the next.
		userRow = defaultUser;
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();
		App.hono.use(sessionMiddleware);

		App.hono.post("/attempt", async (c) => {
			const credentials = (await c.req.json()) as Record<string, string>;
			return c.text(String(await Auth.attempt(credentials)));
		});
	});

	it("rejects an empty password", async () => {
		expect(await attempt({ email: "victim@example.com", password: "" })).toBe("false");
	});

	it("rejects a missing password", async () => {
		expect(await attempt({ email: "victim@example.com" })).toBe("false");
	});

	it("rejects an empty value under the `pass` alias", async () => {
		expect(await attempt({ email: "victim@example.com", pass: "" })).toBe("false");
	});

	it("rejects a wrong password", async () => {
		expect(await attempt({ email: "victim@example.com", password: "nope" })).toBe("false");
	});

	it("rejects a user row that has no password at all", async () => {
		userRow = { id: 2, name: "OAuth Only", email: "oauth@example.com", password: null };
		expect(await attempt({ email: "oauth@example.com", password: "anything" })).toBe("false");
	});

	it("accepts the correct password", async () => {
		expect(await attempt({ email: "victim@example.com", password: "correct-horse" })).toBe("true");
	});
});
