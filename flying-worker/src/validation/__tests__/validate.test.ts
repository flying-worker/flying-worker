import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import App from "../../core/Application";
import { AppRequest } from "../../core/request";
import { ValidationException, toValidationErrors, validateData } from "../index";
import { makeConfig } from "../../core/__tests__/helpers";

/**
 * Cover for AppRequest.validate() — the missing piece between AppRequest.all()
 * and the Zod schemas the framework already ships.
 */

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

describe("validateData()", () => {
	it("returns the parsed value on success", () => {
		const parsed = validateData(loginSchema, {
			email: "ada@example.com",
			password: "correct-horse",
		});

		expect(parsed).toEqual({ email: "ada@example.com", password: "correct-horse" });
	});

	it("applies schema defaults and coercions", () => {
		const schema = z.object({ page: z.coerce.number().default(1) });

		expect(validateData(schema, { page: "3" })).toEqual({ page: 3 });
		expect(validateData(schema, {})).toEqual({ page: 1 });
	});

	it("throws a ValidationException carrying field-keyed messages", () => {
		try {
			validateData(loginSchema, { email: "nope", password: "short" });
			throw new Error("should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationException);
			const errors = (error as ValidationException).errors;
			expect(Object.keys(errors).sort()).toEqual(["email", "password"]);
			expect(errors.email).toHaveLength(1);
		}
	});
});

describe("toValidationErrors()", () => {
	it("joins nested paths with dots and keeps array indexes", () => {
		const errors = toValidationErrors([
			{ path: ["address", "city"], message: "Required" },
			{ path: ["items", 0, "sku"], message: "Required" },
			{ path: [], message: "Root problem" },
		]);

		expect(errors).toEqual({
			"address.city": ["Required"],
			"items.0.sku": ["Required"],
			"": ["Root problem"],
		});
	});

	it("groups several messages under one field", () => {
		const errors = toValidationErrors([
			{ path: ["email"], message: "Required" },
			{ path: ["email"], message: "Must be an email" },
		]);

		expect(errors.email).toEqual(["Required", "Must be an email"]);
	});
});

describe("AppRequest.validate()", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();

		App.hono.post("/login", async (c) => {
			const credentials = await AppRequest.validate(loginSchema);
			return c.json({ ok: true, credentials });
		});

		// Registered up front: Hono refuses new routes once its matcher is built.
		App.hono.post("/search", async (c) => {
			const query = await AppRequest.validate(z.object({ term: z.string().min(2) }));
			return c.json(query);
		});
	});

	const post = (body: unknown) =>
		App.hono.request("/login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});

	it("reads the body without a separate initializeBody() call", async () => {
		const res = await post({ email: "ada@example.com", password: "correct-horse" });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			ok: true,
			credentials: { email: "ada@example.com", password: "correct-horse" },
		});
	});

	it("renders a 422 with a field-keyed error bag", async () => {
		const res = await post({ email: "nope", password: "short" });

		expect(res.status).toBe(422);
		expect(res.headers.get("content-type")).toContain("application/json");

		const body = (await res.json()) as { message: string; errors: Record<string, string[]> };
		expect(body.message).toBe("The given data was invalid.");
		expect(Object.keys(body.errors).sort()).toEqual(["email", "password"]);
	});

	it("validates query parameters alongside the body", async () => {
		const res = await App.hono.request("/search?term=hono", { method: "POST" });

		expect(await res.json()).toEqual({ term: "hono" });
	});
});
