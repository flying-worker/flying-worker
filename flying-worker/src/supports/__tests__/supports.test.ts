import { describe, it, expect } from "vitest";
import { Str, passwordHash, passwordVerify } from "../index";

describe("Str.snake", () => {
	it("lowercases and replaces whitespace runs with the delimiter", () => {
		expect(Str.snake("Flying Worker App")).toBe("flying_worker_app");
		expect(Str.snake("a   b")).toBe("a_b");
	});

	it("honours a custom delimiter", () => {
		expect(Str.snake("Flying Worker", "-")).toBe("flying-worker");
	});

	it("does NOT split camelCase — it only handles whitespace", () => {
		// Documenting actual behaviour: Laravel's Str::snake would give
		// "hello_world" here. Worth knowing before relying on it for keys.
		expect(Str.snake("helloWorld")).toBe("helloworld");
	});
});

describe("Str.contains", () => {
	it("matches a single needle", () => {
		expect(Str.contains("flying worker", "worker")).toBe(true);
		expect(Str.contains("flying worker", "hono")).toBe(false);
	});

	it("matches when any needle in a list is present", () => {
		expect(Str.contains("flying worker", ["hono", "worker"])).toBe(true);
		expect(Str.contains("flying worker", ["hono", "react"])).toBe(false);
	});

	it("is case-sensitive unless told otherwise", () => {
		expect(Str.contains("Flying Worker", "worker")).toBe(false);
		expect(Str.contains("Flying Worker", "worker", true)).toBe(true);
	});
});

describe("Str.slug", () => {
	it("lowercases, replaces non-alphanumerics and trims separators", () => {
		expect(Str.slug("Hello, World!")).toBe("hello-world");
		expect(Str.slug("  Leading and trailing  ")).toBe("leading-and-trailing");
	});

	it("honours a custom separator", () => {
		expect(Str.slug("Hello World", "_")).toBe("hello_world");
	});

	it("collapses a run of separators into one", () => {
		expect(Str.slug("a --- b")).toBe("a-b");
	});
});

describe("Str.uuid", () => {
	it("returns a v4-shaped identifier", () => {
		expect(Str.uuid()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it("does not repeat across calls", () => {
		const ids = new Set(Array.from({ length: 200 }, () => Str.uuid()));

		expect(ids.size).toBe(200);
	});
});

describe("Str.toQueryParams", () => {
	it("serialises a plain object", () => {
		expect(Str.toQueryParams({ page: 2, sort: "name" })).toBe("page=2&sort=name");
	});

	it("drops undefined values but keeps null and empty string", () => {
		expect(Str.toQueryParams({ a: 1, b: undefined, c: "" })).toBe("a=1&c=");
	});

	it("encodes special characters", () => {
		expect(Str.toQueryParams({ q: "a b&c" })).toBe("q=a+b%26c");
	});
});

describe("password hashing", () => {
	it("verifies a correct password", async () => {
		const hash = await passwordHash("correct-horse");

		expect(await passwordVerify("correct-horse", hash)).toBe(true);
	});

	it("rejects a wrong password", async () => {
		const hash = await passwordHash("correct-horse");

		expect(await passwordVerify("battery-staple", hash)).toBe(false);
	});

	it("salts, so the same password hashes differently each time", async () => {
		const [a, b] = await Promise.all([passwordHash("same"), passwordHash("same")]);

		expect(a).not.toBe(b);
		expect(await passwordVerify("same", a)).toBe(true);
		expect(await passwordVerify("same", b)).toBe(true);
	});
});
