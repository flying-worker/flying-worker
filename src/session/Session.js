// @ts-ignore
import { getSession, getSessionStorage } from "remix-hono/session";
class SessionManager {
	constructor(session, sessionStorage) {
		this.session = session;
		this.sessionStorage = sessionStorage;
	}
	get(key, defaultValue = "") {
		const data = this.session.get(key);
		if (data) {
			const parsed = JSON.parse(data);
			return parsed.value;
		}
		return defaultValue;
	}
	set(key, value) {
		const data = JSON.stringify({ value, type: typeof value });
		this.session.set(key, data);
	}
	async destroy() {
		await this.sessionStorage.destroySession(this.session);
	}
	getSession() {
		return this.session;
	}
	getStorage() {
		return this.sessionStorage;
	}
	rawData() {
		return this.session.data;
	}
	flash(key, value) {
		const data = JSON.stringify({ value, type: typeof value });
		this.session.flash(key, data);
	}
	forget(key) {
		this.session.unset(key);
	}
	has(key) {
		const data = this.session.get(key);
		return !!data;
	}
}
let Session;
export function initSession(context) {
	if (!context.req.path.startsWith("/api")) {
		Session = new SessionManager(
			getSession(context),
			getSessionStorage(context),
		);
	}
}
export { Session as default };
