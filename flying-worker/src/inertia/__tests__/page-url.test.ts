import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import App from "../../core/Application"
import { inertiaRender } from "../index"
import { makeConfig } from "../../core/__tests__/helpers"

/**
 * Regression cover for: page.url dropped the query string.
 *
 * Inertia mirrors page.url into the browser's history entry, so rendering
 * /users?page=2 with url: "/users" rewrote the address bar and lost the
 * pagination state on back/forward and on router.reload().
 */

const inertiaHeaders = { "X-Inertia": "true" }

describe("inertiaRender page.url", () => {
	beforeEach(() => {
		App.hono = new Hono()
		App.loadConfig(makeConfig())
		App.basicInit()

		App.hono.get("/users", () => inertiaRender("Users", { page: 2 }))
	})

	it("includes the query string", async () => {
		const res = await App.hono.request("/users?page=2&sort=name", {
			headers: inertiaHeaders,
		})
		const page = (await res.json()) as { url: string }

		expect(page.url).toBe("/users?page=2&sort=name")
	})

	it("is just the path when there is no query string", async () => {
		const res = await App.hono.request("/users", { headers: inertiaHeaders })
		const page = (await res.json()) as { url: string }

		expect(page.url).toBe("/users")
	})

	it("preserves an empty-valued parameter", async () => {
		const res = await App.hono.request("/users?q=", { headers: inertiaHeaders })
		const page = (await res.json()) as { url: string }

		expect(page.url).toBe("/users?q=")
	})
})
