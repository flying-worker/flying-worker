import { Cookie } from "../cookie";
import { getEnv } from "../core";
import { App } from "../core";
import type { Context } from "hono";

export interface SessionData {
	[key: string]: any;
}

export class SessionStore {
	/** Prefix used internally to namespace flash keys and avoid collision with regular session keys. */
	private readonly FLASH_PREFIX = '_flash.';

	private sessionId: string|undefined;
	private data: SessionData = {};
	private readonly kvStore?: any;
	/**
	 * Tracks whether the session data has been modified since it was last loaded.
	 *
	 * Set to `true` by any mutating operation: put(), forget(), flush(), regenerate(), flash().
	 * Checked by save() before writing to KV or cookie — if false, the write is skipped entirely.
	 *
	 * This prevents unnecessary KV writes on every request (e.g. a plain GET that only reads
	 * session data would otherwise cause a write on every hit).
	 */
	private isDirty: boolean = false;

	/**
	 * Snapshot of all flash keys that existed when the session was loaded at the start
	 * of the current request.
	 *
	 * Flash data must survive exactly one request after being set — no more, no less.
	 * We can't rely solely on getFlash() to clean up, because a request may load flash
	 * data but never call getFlash() (e.g. a redirect that doesn't render the message).
	 *
	 * By recording the flash keys present at load time, save() can expire them at the
	 * end of the request regardless of whether they were read. Keys set via flash()
	 * during the current request are added after initialize(), so they are never in
	 * this set and will survive to the next request correctly.
	 */
	private flashKeysAtLoad: Set<string> = new Set();

	private isInitialized: boolean = false;

	constructor() {
		if (App.config.session.driver === "kv") {
			const kvBindingName = getEnv("KV_BINDING_NAME", "kv") as string;
			this.kvStore = App.getContext().env?.[kvBindingName];
			
			if (!this.kvStore) {
				console.warn(`KV binding '${kvBindingName}' not found. Fallback to cookie storage.`);
			}
		}
	}

	/**
	 * Initialize session data
	 */
	async initialize(): Promise<void> {
		let sessionCookie: string | undefined;
		try {
			const cookie = await Cookie.get(App.config.session.cookie_name);
			sessionCookie = cookie || undefined;
		} catch (error) {
			// Ignore cookie errors
		}

		if (this.kvStore) {
			
			// KV: cookie = session ID, data from KV
			this.sessionId = sessionCookie || this.generateSessionId();
			await this.loadFromKV();
		} else {
			// Cookie: everything from cookie
			await this.loadFromCookie(sessionCookie);
			if (!this.sessionId) {
				this.sessionId = this.generateSessionId();
			}
		}

		this.flashKeysAtLoad = new Set(
			Object.keys(this.data).filter(k => k.startsWith(this.FLASH_PREFIX))
		);

		this.isInitialized = true;
	}

	/**
	 * Generate a unique session ID
	 */
	private generateSessionId(): string {
		return crypto.randomUUID();
	}

	/**
	 * Load session data from KV store
	 */
	private async loadFromKV(): Promise<void> {
		try {
			const sessionData = await this.kvStore.get(`session:${this.sessionId}`);
			if (sessionData) {
				this.data = JSON.parse(sessionData);
			}
		} catch (error) {
			console.error("Error loading session from KV:", error);
			this.data = {};
		}
	}

	/**
	 * Load session data from cookie
	 */
	private async loadFromCookie(sessionCookie?: string): Promise<void> {
		try {
			const cookie = sessionCookie || await Cookie.get(App.config.session.cookie_name);
			if (cookie) {
				const sessionData = JSON.parse(cookie);
				this.sessionId = sessionData.sessionId;
				this.data = sessionData.data || {};
			}
		} catch (error) {
			console.error("Error loading session from cookie:", error);
			this.data = {};
		}
	}

	/**
	 * Set a session value - marks session as dirty
	 */
	put(key: string, value: any): void {
		if (!this.isInitialized) {
			throw new Error('Session not initialized. Ensure session middleware is applied.');
		}
		this.data[key] = value;
		this.isDirty = true;
	}

	/**
	 * Get a value from session.
	 * Transparently reads flash data by the original key — no getFlash() needed.
	 * Regular session keys take priority; flash is checked as a fallback.
	 */
	get<T = any>(key: string, defaultValue?: T): T {
		if (!this.isInitialized) {
			throw new Error('Session not initialized. Ensure session middleware is applied.');
		}
		return this.data[key] ?? this.data[`${this.FLASH_PREFIX}${key}`] ?? defaultValue;
	}

	/**
	 * Check if a key exists in session (regular or flash).
	 */
	has(key: string): boolean {
		return key in this.data || `${this.FLASH_PREFIX}${key}` in this.data;
	}

	/**
	 * Remove a key from session - marks session as dirty
	 */
	forget(key: string): void {
		delete this.data[key];
		this.isDirty = true; // Mark as modified
	}

	/**
	 * Get all session data. Flash keys are returned under their original names
	 * (without the internal _flash. prefix) so callers never see the implementation detail.
	 */
	all(): SessionData {
		const result: SessionData = {};
		for (const [key, value] of Object.entries(this.data)) {
			if (key.startsWith(this.FLASH_PREFIX)) {
				result[key.substring(this.FLASH_PREFIX.length)] = value;
			} else {
				result[key] = value;
			}
		}
		return result;
	}

	/**
	 * Clear all session data - marks session as dirty
	 */
	flush(): void {
		this.data = {};
		this.isDirty = true; // Mark as modified
	}

	/**
	 * Get session ID
	 */
	getId(): string {
		return this.sessionId || '';
	}


	/**
	 * Save session data and renew expiry
	 */
	async save(): Promise<void> {
		// Expire flash keys that were present when the session loaded.
		// This guarantees flash survives exactly one request even if getFlash() was never called.
		// Keys set via flash() during this request are not in flashKeysAtLoad, so they are kept.
		for (const key of this.flashKeysAtLoad) {
			if (key in this.data) {
				delete this.data[key];
				this.isDirty = true;
			}
		}

		if (!this.isDirty) return;

		if (this.kvStore) {
			await this.saveToKV();
		} else {
			await this.saveToCookie();
		}

		this.isDirty = false;
	}

	/**
	 * Save session data to KV store
	 */
	private async saveToKV(): Promise<void> {
		try {
			// Parse session lifetime
			const lifetimeInSeconds =  App.config.session.lifetime * 60;

			const expirationTime = new Date(Date.now() + lifetimeInSeconds * 1000);

			// Save session data to KV store
			await this.kvStore.put(
				`session:${this.sessionId}`,
				JSON.stringify(this.data),
				{
					expiration: Math.floor(expirationTime.getTime() / 1000)
				}
			);

			// Save session ID in cookie
			const cookieLifetime = `${App.config.session.lifetime}m`;
				
			await Cookie.set(
				App.config.session.cookie_name,
				this.sessionId!,
				cookieLifetime
			);
		} catch (error) {
			console.error("Error saving session to KV:", error);
			throw error;
		}
	}

	/**
	 * Save session data to cookie
	 */
	private async saveToCookie(): Promise<void> {
		try {
			const sessionData = {
				sessionId: this.sessionId,
				data: this.data
			};

			const cookieLifetime = typeof App.config.session.lifetime === "string" 
				? App.config.session.lifetime
				: `${App.config.session.lifetime}m`;
				
			await Cookie.set(
				App.config.session.cookie_name,
				JSON.stringify(sessionData),
				cookieLifetime
			);
		} catch (error) {
			console.error("Error saving session to cookie:", error);
			throw error;
		}
	}

	/**
	 * Regenerate the session ID.
	 *
	 * Session data is carried over to the new ID. Pass `destroy = true` to also
	 * delete the record held under the previous ID, so a session cookie captured
	 * before the regeneration can no longer be replayed against the old record.
	 */
	async regenerate(destroy = false): Promise<void> {
		const previousId = this.sessionId;

		this.sessionId = this.generateSessionId();
		this.isDirty = true;

		if (destroy && previousId && this.kvStore) {
			try {
				await this.kvStore.delete(`session:${previousId}`);
			} catch (error) {
				// A stale record left behind expires on its own TTL; failing the
				// request over it would be worse than the leftover.
				console.error("Error deleting previous session from KV:", error);
			}
		}
	}

	/**
	 * Drop every value in the session and issue a new ID, deleting the record
	 * held under the previous ID.
	 *
	 * `flush()` alone leaves the old record readable, and `regenerate()` alone
	 * carries the data across to the new ID — invalidating needs both.
	 */
	async invalidate(): Promise<void> {
		this.flush();
		await this.regenerate(true);
	}

	/**
	 * Flash data - data that exists only for the next request
	 */
	flash(key: string, value: any): void {
		this.put(`${this.FLASH_PREFIX}${key}`, value);
	}

}

export const resolveSession = (): SessionStore => {
	return App.getContainer().resolve('Session', () => {
		return new SessionStore();
	});
};
