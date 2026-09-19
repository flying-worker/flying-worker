import type { Context } from "hono";
import { AppRequest, Auth } from "flying-worker";

/**
 * Example auth controller for the API guard.
 *
 * Shows the shape a real controller takes: read input off the request, return
 * a Response on every path, and let the guard decide session vs JWT. The
 * default API guard is configured in `config/auth.ts` (`defaultApiGuard`), so
 * nothing here names a guard explicitly — `Auth.guard('web')` would opt a
 * single call into the session guard instead.
 */
export class AuthController {
	/** POST /api/login */
	async login(c: Context) {
		await AppRequest.initializeBody();

		const email = AppRequest.input("email");
		const password = AppRequest.input("password");

		if (!email || !password) {
			return c.json({ message: "Email and password are required." }, 422);
		}

		// On a JWT guard attempt() resolves to the signed token, or false when
		// the credentials do not match.
		const token = await Auth.attempt({ email, password });

		if (!token) {
			return c.json({ message: "These credentials do not match our records." }, 401);
		}

		return c.json({ token, user: await Auth.user() });
	}

	/** GET /api/user */
	async user(c: Context) {
		if (!Auth.check()) {
			return c.json({ message: "Unauthenticated." }, 401);
		}

		return c.json({ user: await Auth.user() });
	}

	/** POST /api/logout */
	async logout(c: Context) {
		await Auth.logout();

		return c.json({ message: "Logged out." });
	}
}
