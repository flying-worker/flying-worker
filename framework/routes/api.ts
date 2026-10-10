/**
 * API Routes
 *
 * This file defines the Hono API routes for the application.
 *
 * You can change the prefix for these routes in `bootstrap/App.tsx`.
 * For example, if the prefix is set to `/api`, these routes will be accessible as:
 * - GET `/api/` -> Calls the `apiIndex` function
 * - GET `/api/set-session` -> Calls the `SessionSet` function
 */

import { Route } from "flying-worker/route";
import { AuthController } from "../app/controllers/AuthController";

Route.post("/login", [AuthController, "login"]);
Route.get("/user", [AuthController, "user"]);
Route.post("/logout", [AuthController, "logout"]);

// import { UserController } from "../app/controllers/UserController";

// Route.get("/", [UserController, "testWeb"], ["test"]);


// Route.group(
// 	"/users",
// 	() => {
// 		Route.get("/", [UserController, "index"]);
// 	},
// 	["test"],
// );
