import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import { makeConfig } from "../../core/__tests__/helpers";

describe("FileManager facade", () => {
	it("allows the root package to be imported during application boot", async () => {
		let imported = false;
		await App.boot(new Hono(), makeConfig({
			apiRoute: async () => {
				const { FileManager, Auth, AppRequest } = await import("../../index");
				expect(FileManager).toBeDefined();
				expect(Auth).toBeDefined();
				expect(AppRequest).toBeDefined();
				imported = true;
			},
		}));
		expect(imported).toBe(true);
	});

	it("uploads and deletes files through the public facade inside requests", async () => {
		const { FileManager } = await import("../../index");
		const bucket = {
			put: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined),
		};
		const config = makeConfig();
		config.r2 = { bucket, publicUrl: "https://files.example" };
		App.loadConfig(config);
		App.hono = new Hono();
		App.basicInit();
		const file = new File(["hello"], "hello.txt", { type: "text/plain" });

		App.hono.post("/files/:key", async (c) => {
			const key = await FileManager.upload(file, c.req.param("key"));
			const url = FileManager.getPublicUrl(key);
			await FileManager.delete(key);
			return c.json({ key, url });
		});

		for (const key of ["first.txt", "second.txt"]) {
			const response = await App.hono.request(`/files/${key}`, { method: "POST" });
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ key, url: `https://files.example/${key}` });
			expect(bucket.put).toHaveBeenLastCalledWith(key, file, {
				httpMetadata: { contentType: "text/plain" }, customMetadata: undefined,
			});
			expect(bucket.delete).toHaveBeenLastCalledWith(key);
		}
		expect(bucket.put).toHaveBeenCalledTimes(2);
		expect(bucket.delete).toHaveBeenCalledTimes(2);
	});
});
