/**
 * API Routes
 *
 * This file defines the Hono API routes for the application.
 *
 * You can change the prefix for these routes in `bootstrap/App.ts`.
 * For example, if the prefix is set to `/api`, these routes will be accessible as:
 * - GET `/api/` -> Calls the `apiIndex` function
 * - GET `/api/set-session` -> Calls the `SessionSet` function
 */

import { Context } from "hono";
import { UserController } from "../controllers/UserController";
import Auth from "../src/auth/Auth";
import { App } from "../src/core";
import {ReactRoute, Route} from "../src/route";
import { Session } from "../src/session";

App.hono.post("test-001", async (context: Context) => {
	return context.json({
		data: "Hello",
	});
});

Route.get("/web", async (context: Context) => {
	Session.set("name", "Emran");

	// const statement = sql.raw(`select * from 'users' where id = 2`);
	// const res: unknown[] = await drizzle(getEnv("DB")).get(statement)

	return context.json({
		dd: await Auth.attempt({ email: "admin@admin.com" }),
	});
});

Route.get("/test", [UserController, "testWeb"]);

Route.get("/test/user", [UserController, "user"]);

ReactRoute("/", "./resources/react/pages/Index.tsx");
ReactRoute("/login", "./resources/react/pages/Login.tsx");

ReactRoute(
	"/product",
	async () => {
		ReactRoute("/", "./resources/react/pages/KV.tsx");
	},
	["test"],
);

