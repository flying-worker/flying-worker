import { describe, it, expect, expectTypeOf, beforeEach } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import App from "../../core/Application";
import { AppRequest } from "../../core/request";
import { ValidationException, toValidationErrors, validateData, validateDataAsync } from "../index";
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
	it("accepts transforms with different input and output types", () => {
		const parsed = validateData(z.string().transform((value) => value.length), "hello");
		expectTypeOf(parsed).toEqualTypeOf<number>();
		expect(parsed).toBe(5);
	});

	it("validates async refinements and transforms", async () => {
		const schema = z.string().refine(async (value) => value === "hello", "Rejected")
			.transform(async (value) => value.length);
		const parsed = await validateDataAsync(schema, "hello");
		expectTypeOf(parsed).toEqualTypeOf<number>();
		expect(parsed).toBe(5);
		await expect(validateDataAsync(schema, "no")).rejects.toBeInstanceOf(ValidationException);
	});

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
	it("safely groups fields that match Object prototype properties", async () => {
		const keys = ["__proto__", "constructor", "toString", "hasOwnProperty"];
		const errors = toValidationErrors(keys.flatMap((key) => [
			{ path: [key], message: "Required" },
			{ path: [key], message: "Invalid" },
		]));
		for (const key of keys) {
			expect(Object.hasOwn(errors, key)).toBe(true);
			expect(errors[key]).toEqual(["Required", "Invalid"]);
		}
		const body = await new ValidationException(errors).getResponse().json();
		expect(Object.keys(body.errors)).toEqual(keys);
	});

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

		App.hono.post("/async", async (c) => {
			const parsed = await AppRequest.validate(z.object({
				name: z.string().refine(async (value) => value === "ada", "Unknown name")
					.transform(async (value) => value.length),
			}));
			expectTypeOf(parsed).toEqualTypeOf<{ name: number }>();
			return c.json(parsed);
		});

		App.hono.post("/combined", async (c) => {
			return c.json(await AppRequest.validate(z.object({
				page: z.coerce.number(), term: z.string(),
			})));
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

	it("validates query parameters without a body", async () => {
		const res = await App.hono.request("/search?term=hono", { method: "POST" });

		expect(await res.json()).toEqual({ term: "hono" });
	});

	it.each([
		["application/json", JSON.stringify({ term: "hono" })],
		["application/x-www-form-urlencoded", "term=hono"],
	])("combines query parameters with a %s body", async (contentType, body) => {
		const res = await App.hono.request("/combined?page=2", {
			method: "POST", headers: { "content-type": contentType }, body,
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ page: 2, term: "hono" });
	});

	it("renders async refinement failures as 422 and returns transformed output", async () => {
		for (const name of ["ada", "unknown"]) {
			const res = await App.hono.request("/async", {
				method: "POST", headers: { "content-type": "application/json" },
				body: JSON.stringify({ name }),
			});
			expect(res.status).toBe(name === "ada" ? 200 : 422);
			const body = await res.json();
			if (name === "ada") expect(body).toEqual({ name: 3 });
			else expect(body.errors).toEqual({ name: ["Unknown name"] });
		}
	});

});
