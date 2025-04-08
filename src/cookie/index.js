import { deleteCookie, getSignedCookie, setCookie } from "hono/cookie";
import { Request } from "../core";
import App from "../core/Application";
export function parseLifetime(duration) {
	const match = duration.match(/^(\d+)([smhd])$/);
	if (!match) throw new Error("Invalid duration format");
	const value = Number.parseInt(match[1], 10);
	const unit = match[2];
	switch (unit) {
		case "s":
			return value;
		case "m":
			return value * 60;
		case "h":
			return value * 60 * 60;
		case "d":
			return value * 24 * 60 * 60;
		default:
			throw new Error("Invalid duration unit");
	}
}
export const Cookie = {
	set: (name, value, maxAge = null) => {
		const maxAgeValue =
			maxAge !== null && maxAge !== void 0
				? maxAge
				: App.config.session.lifetime;
		let expiresInSeconds =
			typeof maxAgeValue === "string"
				? parseLifetime(maxAgeValue)
				: maxAgeValue;
		setCookie(Request.getContext(), name, value, {
			signingSecret: App.config.app.secret,
			path: App.config.session.path,
			secure: App.config.session.secure,
			httpOnly: App.config.session.httpOnly,
			maxAge: expiresInSeconds,
			sameSite: App.config.session.sameSite,
		});
	},
	get: async (name) => {
		return await getSignedCookie(
			Request.getContext(),
			App.config.app.secret,
			name,
		);
	},
	delete: (name) => {
		deleteCookie(Request.getContext(), name);
	},
};
