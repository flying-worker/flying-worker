import { deleteCookie, getCookie, getSignedCookie, setCookie, setSignedCookie } from "hono/cookie";
import { App, AppRequest } from "../core";

/**
 * Parse a human-readable duration string into seconds.
 * Supported units: s (seconds), m (minutes), h (hours), d (days).
 * Example: "30m" → 1800, "2h" → 7200
 */
function parseLifetime(duration: string): number {
	const match = duration.match(/^(\d+)([smhd])$/);
	if (!match) throw new Error(`Invalid duration format: "${duration}". Expected format: <number><s|m|h|d>`);

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	switch (unit) {
		case "s": return value;
		case "m": return value * 60;
		case "h": return value * 60 * 60;
		case "d": return value * 24 * 60 * 60;
		default:  throw new Error(`Invalid duration unit: "${unit}"`);
	}
}

export { parseLifetime };

type SameSite = "Strict" | "Lax" | "None";

interface SignedCookieOptions {
	path?: string;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: SameSite;
}

interface UnsignedCookieOptions {
	maxAge?: number;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: SameSite;
}

export const Cookie = {
	/**
	 * Set a signed (HMAC-verified) cookie.
	 * Defaults to session config values for path/secure/httpOnly/sameSite,
	 * all of which can be overridden via options.
	 * If maxAge is null the cookie expires at end of browser session.
	 */
	set: async (
		name: string,
		value: string,
		maxAge: string | number | null = null,
		options: SignedCookieOptions = {},
	): Promise<void> => {
		const expiresInSeconds = maxAge === null
			? undefined
			: typeof maxAge === "string"
				? parseLifetime(maxAge)
				: maxAge;

		await setSignedCookie(AppRequest.getContext(), name, value, App.config.app.secret, {
			path:     options.path     ?? App.config.session.path,
			secure:   options.secure   ?? App.config.session.secure,
			httpOnly: options.httpOnly ?? App.config.session.httpOnly,
			sameSite: options.sameSite ?? App.config.session.sameSite,
			...(expiresInSeconds !== undefined && { maxAge: expiresInSeconds }),
		});
	},

	/**
	 * Set an unsigned cookie (readable by JavaScript).
	 * Primarily used for CSRF tokens and other client-accessible values.
	 */
	setUnsigned: (
		name: string,
		value: string,
		options: UnsignedCookieOptions = {},
	): void => {
		setCookie(AppRequest.getContext(), name, value, {
			path:     "/",
			secure:   options.secure   ?? App.config.session.secure,
			httpOnly: options.httpOnly ?? false,
			sameSite: options.sameSite ?? "Lax",
			...(options.maxAge !== undefined && { maxAge: options.maxAge }),
		});
	},

	/**
	 * Get a signed cookie. Returns the value string if valid, or undefined if
	 * the cookie is missing. Logs a warning and returns undefined if the
	 * signature is invalid (tampered cookie) rather than silently ignoring it.
	 */
	get: async (name: string): Promise<string | undefined> => {
		const result = await getSignedCookie(AppRequest.getContext(), App.config.app.secret, name);

		if (result === false) {
			console.warn(`Cookie "${name}" has an invalid signature — it may have been tampered with.`);
			return undefined;
		}

		return result ?? undefined;
	},

	/**
	 * Get an unsigned cookie value.
	 */
	getUnsigned: (name: string): string | undefined => {
		return getCookie(AppRequest.getContext(), name);
	},

	/**
	 * Delete a cookie.
	 */
	delete: (name: string): void => {
		deleteCookie(AppRequest.getContext(), name);
	},
};
