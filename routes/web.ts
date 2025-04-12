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
import { Route } from "../src/route";

App.hono.post("test-001", async (context: Context) => {
	return context.json({
		data: "Hello",
	});
});

Route.get("/web", async (context: Context) => {
	return context.json({
		dd: await Auth.attempt({ email: "admin@admin.com" }),
	});
});

Route.get("/test", [UserController, "testWeb"]);

Route.get("/test/user", [UserController, "user"]);
