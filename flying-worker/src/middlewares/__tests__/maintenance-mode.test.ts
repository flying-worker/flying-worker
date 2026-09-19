import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import MaintenanceMode from "../MaintenanceMode";
import Route from "../../route/Route";
import { makeConfig } from "../../core/__tests__/helpers";
import type { Config } from "../../type-declaration";

function configWithMaintenance(status: boolean, message: string): Config {
	const config = makeConfig({
		global: [MaintenanceMode],
		webRoute: () => Route.get("/", (c) => c.text("app")),
	});
	config.app.maintenance = { status, message };
	return config;
}

describe("MaintenanceMode", () => {
	it("passes the request through when disabled", async () => {
		Route.reset();
		App.hono = new Hono();
		App.loadConfig(configWithMaintenance(false, "Down for now"));
		await App.boot(App.hono, App.config);

		const res = await App.hono.request("/");

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("app");
	});

	it("short-circuits with the configured message when enabled", async () => {
		Route.reset();
		App.hono = new Hono();
		App.loadConfig(configWithMaintenance(true, "<h1>Back soon</h1>"));
		await App.boot(App.hono, App.config);

		const res = await App.hono.request("/");

		expect(await res.text()).toBe("<h1>Back soon</h1>");
		expect(res.headers.get("content-type")).toContain("text/html");
	});

	it("covers every route, not just the ones declared after it", async () => {
		Route.reset();
		App.hono = new Hono();
		App.loadConfig(configWithMaintenance(true, "Down"));
		await App.boot(App.hono, App.config);

		expect(await (await App.hono.request("/")).text()).toBe("Down");
		expect(await (await App.hono.request("/anything-else")).text()).toBe("Down");
	});
});
