import { describe, it, expect } from "vitest";
import { AuthUserSchema } from "../index";
import type { AuthenticatedUser, AuthUser } from "../../type-declaration";

/**
 * Regression cover for: rolePermissions was validated as a single object.
 *
 * Every consumer treats it as a list — Auth assigns it to RolePermission[] and
 * hasRole()/hasPermission() call .some() on it — so passing the documented
 * array shape threw a ZodError from login(), which attempt() then swallowed
 * into a bare `false`.
 */

const base = { id: 1, name: "Ada", email: "ada@example.com" };

const permission = { id: 1, role: "admin", permissions: ["users.read"] };

describe("AuthUserSchema.rolePermissions", () => {
	it("accepts an array", () => {
		expect(() => AuthUserSchema.parse({ ...base, rolePermissions: [permission] })).not.toThrow();
	});

	it("accepts several entries", () => {
		const two = [permission, { id: 2, role: "editor", permissions: ["posts.write"] }];

		expect(() => AuthUserSchema.parse({ ...base, rolePermissions: two })).not.toThrow();
	});

	it("accepts an empty array", () => {
		expect(() => AuthUserSchema.parse({ ...base, rolePermissions: [] })).not.toThrow();
	});

	it("still accepts null and undefined", () => {
		expect(() => AuthUserSchema.parse({ ...base, rolePermissions: null })).not.toThrow();
		expect(() => AuthUserSchema.parse(base)).not.toThrow();
	});

	it("rejects a single bare object", () => {
		expect(() => AuthUserSchema.parse({ ...base, rolePermissions: permission })).toThrow();
	});
});

describe("role/permission types", () => {
	it("accepts a list of roles, matching the runtime implementation", () => {
		// Compile-time cover: hasRole was typed `string | [string]`, a
		// one-element tuple, so a multi-role check failed typecheck even though
		// the implementation maps over the whole array.
		const user = {
			...base,
			hasRole: (role: string | string[]) => Array.isArray(role),
			hasPermission: () => true,
			rolePermissions: [permission],
		} satisfies AuthenticatedUser;

		expect(user.hasRole(["admin", "editor"])).toBe(true);
	});

	it("accepts multiple rolePermissions on AuthUser", () => {
		const user: AuthUser = {
			...base,
			rolePermissions: [permission, { id: 2, role: "editor", permissions: [] }],
		};

		expect(user.rolePermissions).toHaveLength(2);
	});
});
