/**
 * Web Routes
 *
 * This file defines web routes for the application.
 * You can change the API prefix in `config/app.ts`.
 */

import { Context } from "hono";
import {App, AppRequest} from "flying-worker/core";
import { Route } from "flying-worker/route";
import { inertiaRender } from "flying-worker/inertia";
import {Cookie} from "flying-worker/cookie";

App.hono.get('/', c => inertiaRender('Home', { name: 'World', user: 'Alice' }))

App.hono.get('/about', c => inertiaRender('About', { team: 'Hono + Inertia on Workers', user: 'Bob' }))

Route.get("/product", async (context: Context) => {
	// await Cookie.set("product", "T-short")
	 // Cookie.delete("product")
	return context.json({
		data: await Cookie.get("product"),
	});
});
