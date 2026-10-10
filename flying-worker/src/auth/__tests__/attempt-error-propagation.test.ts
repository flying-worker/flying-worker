import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { Hono } from "hono";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import App from "../../core/Application";
import { Auth } from "../index";
import { sessionMiddleware } from "../../session";
import { passwordHash } from "../../supports";
import type { Config } from "../../type-declaration";

/**
 * Regression cover for: attempt() reported every failure as bad credentials.
 *
 * The call to login() was wrapped in a bare `catch { return false }`, so a
 * missing session middleware, a D1 outage or a schema mismatch all surfaced to
 * the developer as a wrong password — the worst debugging trap in the auth
 * layer.
 */

const users = sqliteTable("users", {
	id: integer("id").primaryKey(),
	name: text("name"),
	email: text("email"),
	password: text("password"),
});

let userRow: Record<string, unknown> | undefined;

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
		database: { default: "d1", connections: { d1: { connection: () => fakeDb } } },
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

/** Register /attempt, optionally without the session middleware. */
function boot({ withSession }: { withSession: boolean }) {
	App.hono = new Hono();
	App.loadConfig(makeConfig());
	App.basicInit();
	if (withSession) App.hono.use(sessionMiddleware);

	App.hono.post("/attempt", async (c) => {
		try {
			return c.json({ result: await Auth.attempt({ email: "ada@example.com", password: "correct-horse" }) });
		} catch (error) {
			return c.json({ threw: (error as Error).message });
		}
	});
}

const attempt = () => App.hono.request("/attempt", { method: "POST" });

describe("Auth.attempt() error propagation", () => {
	beforeAll(async () => {
		userRow = {
			id: 1,
			name: "Ada",
			email: "ada@example.com",
			password: await passwordHash("correct-horse"),
		};
	});

	beforeEach(() => {
		userRow = {
			id: 1,
			name: "Ada",
			email: "ada@example.com",
			password: userRow!.password,
		};
	});

	it("propagates a missing session middleware instead of reporting bad credentials", async () => {
		boot({ withSession: false });

		const body = (await (await attempt()).json()) as { result?: unknown; threw?: string };

		expect(body.result).toBeUndefined();
		expect(body.threw).toMatch(/Session not initialized/i);
	});

	it("still returns true when everything is wired up", async () => {
		boot({ withSession: true });

		expect(await (await attempt()).json()).toEqual({ result: true });
	});
});
