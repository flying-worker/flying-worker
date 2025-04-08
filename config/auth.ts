import { type AuthConfig } from "../src/type-declaration";

export const authConfig: AuthConfig = {
	defaultGuard: "web",
	guards: {
		web: {
			driver: "session",
			userTable: "users",
			rolePermissionTable: "role_permissions",
		},
		api: {
			driver: "jwt",
			useCookie: {
				status: true,
				maxAge: "2d", // number as second and 1s, 2m,3h, 4d
				key: "authorization-token",
			},
			userTable: "users",
			rolePermissionTable: "role_permissions",
			tokenTable: "user_access_token",
		},
		pro: {
			driver: "jwt",
			useCookie: {
				status: true,
				maxAge: "2d", // number as second and 1s, 2m,3h, 4d
				key: "authorization-token",
			},
			userTable: "users",
			rolePermissionTable: "role_permissions",
			tokenTable: "user_access_token",
		},
	},
};
