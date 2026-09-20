import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { Hono } from "hono";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import App from "../../core/Application";
import { Auth } from "../index";
import { sessionMiddleware } from "../../session";
import { passwordHash } from "../../supports";
import type { Config } from "../../type-declaration";

/**
 * Regression cover for: sensitive columns reached the client.
 *
 * formatUserData stripped `password` only, while attempt() and
 * setSessionUser() spread the whole D1 row into the user object — so
 * remember_token survived into App.currentState.authUser and went out through
 * Inertia's shared `auth.user` prop. setJwtUser stripped it; the session path
 * did not.
 */

const users = sqliteTable("users", {
	id: integer("id").primaryKey(),
	name: text("name"),
	email: text("email"),
	password: text("password"),
	remember_token: text("remember_token"),
});

let userRow: Record<string, unknown>;

const fakeDb = {
	select: () => ({
		from: () => ({ where: () => ({ get: async () => userRow, all: async () => [] }) }),
	}),
};

function makeConfig(hidden?: string[]): Config {
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
				web: { driver: "session", userTable: users, ...(hidden ? { hidden } : {}) },
				api: { driver: "jwt", useCookie: { status: false, key: "token", maxAge: "1h" } },
			},
		},
	} as unknown as Config;
}

function boot(hidden?: string[]) {
	App.hono = new Hono();
	App.loadConfig(makeConfig(hidden));
	App.basicInit();
	App.hono.use(sessionMiddleware);

	// Fresh login: attempt() spreads the D1 row into the user object.
	App.hono.post("/login", async (c) => {
		await Auth.attempt({ email: "ada@example.com", password: "correct-horse" });
		return c.json(await Auth.user());
	});

	// Subsequent request: setSessionUser() reloads the row from the database.
	App.hono.get("/me", async (c) => c.json(await Auth.user()));
}

const login = () => App.hono.request("/login", { method: "POST" });

function sessionCookie(res: Response): string {
	const raw = res.headers.get("set-cookie") ?? "";
	const match = raw.match(/fw_session=([^;,]*)/);
	return match ? `fw_session=${match[1]}` : "";
}

describe("hidden user columns", () => {
	beforeAll(async () => {
		userRow = {
			id: 1,
			name: "Ada",
			email: "ada@example.com",
			password: await passwordHash("correct-horse"),
			remember_token: "super-secret-token",
			avatar: "ada.png",
		};
	});

	beforeEach(() => boot());

	it("keeps password and remember_token off the user returned by login", async () => {
		const user = (await (await login()).json()) as Record<string, unknown>;

		expect(user).not.toHaveProperty("password");
		expect(user).not.toHaveProperty("remember_token");
	});

	it("keeps them off the user reloaded on a later request", async () => {
		const cookie = sessionCookie(await login());
		const user = (await (
			await App.hono.request("/me", { headers: { cookie } })
		).json()) as Record<string, unknown>;

		expect(user.id).toBe(1);
		expect(user).not.toHaveProperty("password");
		expect(user).not.toHaveProperty("remember_token");
	});

	it("leaves non-sensitive columns in place", async () => {
		const user = (await (await login()).json()) as Record<string, unknown>;

		expect(user.email).toBe("ada@example.com");
		expect(user.avatar).toBe("ada.png");
	});

	it("honours a per-guard `hidden` override", async () => {
		boot(["password", "remember_token", "avatar"]);
		const user = (await (await login()).json()) as Record<string, unknown>;

		expect(user).not.toHaveProperty("avatar");
		expect(user.email).toBe("ada@example.com");
	});
});
