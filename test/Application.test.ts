import { Hono } from "hono";
import { describe, expect, it, test } from "vitest";
import { App } from "../src/core";
import { GetReactRoutes } from "../src/route";

class MockKV {
	private store: Map<string, string> = new Map();

	async get(key: string): Promise<string | undefined> {
		return this.store.get(key);
	}

	async put(key: string, value: string): Promise<void> {
		this.store.set(key, value);
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}
}

const mockKV = new MockKV();

const env = {
	APP_NAME: "Flying Worker",
	APP_SECRET: "12086fb500fc4bafae7d660773b554c6",
	SESSION_DRIVER: "kv",
	APP_MAINTENANCE_MODE: false,
	D1_BINDING_NAME: "DB",
	D1_DB_NAME: "flying-worker",

	kv: mockKV,
};

App.setEnv(env);

const config = await import("../config");

await App.boot(config.default);

describe("Application", () => {
	test("should initialize without errors", async () => {
		expect(App.hono).toBeInstanceOf(Hono);
	});

	it("should load configuration files", async () => {
		expect(App.config).toBeDefined();
		expect(App.config.session).toBeDefined();
	});

	it("Check all required property exist on appConfig", async () => {
		expect(App.config.app.name).toBe("Flying Worker");

		expect(typeof App.config.app.secret).toBe("string");

		expect(Array.isArray(App.config.app.middlewares)).toBe(true);

		expect(App.config.session.driver).toBe("kv");
	});

	it("Load Hono Route", async () => {
		const apiRoute = App.hono.routes.find(
			(route) => route.path === "/api" && route.method === "GET",
		);

		expect(apiRoute).toBeDefined();
		expect(typeof apiRoute?.handler).toBe("function");

		const groupRoute = App.hono.routes.find(
			(route) => route.path === "/api/users" && route.method === "GET",
		);

		expect(groupRoute).toBeDefined();
		expect(typeof groupRoute?.handler).toBe("function");

		try {
			const response = await App.hono.request("/", { method: "GET" }, env); // Simulating a GET request

			expect(response.status).toBe(200);
			const data: any = await response.json();
			expect(data?.data).toBe("Protected by middleware");
		} catch (error: any) {
			expect(error.message).toContain("renderToReadableStream");
		}
	});

	it("Load Remix Route", async () => {
		const remixRoute = GetReactRoutes().find(
			(route) => route.path === "/login",
		);

		expect(remixRoute).toBeDefined();
		expect(typeof remixRoute?.file).toBe("string");
	});
});
