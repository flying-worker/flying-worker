import { getSession, getSessionStorage } from "remix-hono/session";
import { Request as CustomRequest } from "../core";

class SessionManager {
	public getSession() {
		return getSession(CustomRequest.getContext());
	}

	public getStorage() {
		return getSessionStorage(CustomRequest.getContext());
	}

	public get(key: string, defaultValue: any = ""): any {
		const data = this.getSession().get(key);

		if (data) {
			const parsed = JSON.parse(data);

			return parsed.value;
		}

		return defaultValue;
	}

	public set(key: string, value: any): void {
		const data = JSON.stringify({ value, type: typeof value });

		this.getSession().set(key, data);
	}

	public async destroy() {
		await this.getStorage().destroySession(this.getSession());
	}

	public rawData() {
		return this.getSession().data;
	}

	public flash(key: string, value: any): void {
		const data = JSON.stringify({ value, type: typeof value });

		this.getSession().flash(key, data);
	}

	public forget(key: string): void {
		this.getSession().unset(key);
	}

	public has(key: string): boolean {
		const data = this.getSession().get(key);

		return !!data;
	}
}

let Session: SessionManager = new SessionManager();

export { Session as default };
