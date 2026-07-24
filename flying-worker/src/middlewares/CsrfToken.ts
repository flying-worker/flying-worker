import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { Cookie } from "../cookie";
import { App, AppRequest } from "../core";
import BaseMiddleware from "../core/abstraction/BaseMiddleware";
import { Session } from "../session";

/** Token byte length — drives both generation and validation. */
const TOKEN_BYTES = 20;

export default class CsrfToken extends BaseMiddleware {

	/** Paths excluded from CSRF checks (supports trailing *). */
	protected isExceptPath = (path: string): boolean => {
		return App.config.csrf.avoidPath.some((pattern: string) => {
			if (pattern.endsWith("*")) {
				return path.startsWith(pattern.slice(0, -1));
			}
			return path === pattern;
		});
	};

	/** Safe/read-only HTTP methods — no CSRF check needed. */
	private isReading(method: string): boolean {
		return method === "GET" || method === "HEAD" || method === "OPTIONS";
	}

	/** Generate a cryptographically secure random hex token. */
	private generateToken(): string {
		const bytes = new Uint8Array(TOKEN_BYTES);
		crypto.getRandomValues(bytes);
		return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
	}

	/**
	 * Encode a raw token for safe delivery to the client.
	 *
	 * XORs the token bytes with a random per-request nonce, then base64-encodes
	 * the combined [nonce + xored] payload. The nonce is different on every
	 * response so the cookie value changes each request — mitigating BREACH-style
	 * compression side-channel attacks even though the underlying session token
	 * does not change.
	 *
	 * Layout: base64( nonce[N] + (token[N] XOR nonce[N]) )
	 */
	private encodeToken(token: string): string {
		const tokenBytes = new TextEncoder().encode(token);
		const nonce      = crypto.getRandomValues(new Uint8Array(tokenBytes.length));
		const xored      = tokenBytes.map((b, i) => b ^ nonce[i]);

		const combined = new Uint8Array(nonce.length + xored.length);
		combined.set(nonce);
		combined.set(xored, nonce.length);

		return btoa(String.fromCharCode(...combined));
	}

	/**
	 * Reverse encodeToken — split nonce and XOR'd payload, XOR back to recover
	 * the original raw token. Returns null if the input is malformed.
	 */
	private decodeToken(encoded: string): string | null {
		try {
			const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
			const mid   = bytes.length / 2;

			if (!Number.isInteger(mid)) return null;

			const nonce      = bytes.slice(0, mid);
			const xored      = bytes.slice(mid);
			const tokenBytes = xored.map((b, i) => b ^ nonce[i]);

			return new TextDecoder().decode(tokenBytes);
		} catch {
			return null;
		}
	}

	/**
	 * Return the existing session CSRF token, or generate and store a new one.
	 * Tokens are not rotated per-request — only on login/logout/regenerate.
	 */
	private ensureSessionToken(): string {
		const expectedLength = TOKEN_BYTES * 2; // hex: 2 chars per byte
		let token = Session.get<string>("_token");
		if (typeof token !== "string" || token.length !== expectedLength) {
			token = this.generateToken();
			Session.put("_token", token);
		}
		return token;
	}

	/**
	 * Resolve the token from the request to its raw form for comparison.
	 *
	 * Three sources, each handled differently to match what the client sends:
	 *
	 * 1. `_token` form field
	 *    The raw session token printed by csrf_token() in the view.
	 *    Compared directly — no decoding needed.
	 *
	 * 2. X-CSRF-TOKEN header
	 *    Manually set by JS from a meta tag or API response.
	 *    Also the raw token — compared directly.
	 *
	 * 3. X-XSRF-TOKEN header
	 *    Automatically set by Axios / Angular from the XSRF-TOKEN cookie.
	 *    Axios URL-encodes the cookie value before putting it in the header,
	 *    and the cookie holds the XOR-encoded token — so decode in two steps:
	 *      a. URL-decode (reverse Axios encoding)
	 *      b. XOR-decode  (reverse encodeToken)
	 *    Then compare the resulting raw token.
	 */
	private async getResolvedToken(context: Context): Promise<string | null> {
		// 1. Form body — raw token
		const fromBody = AppRequest.input("_token") as string | null;
		if (fromBody) return fromBody;

		// 2. X-CSRF-TOKEN — raw token set manually by JS
		const csrfHeader = context.req.header("x-csrf-token");
		if (csrfHeader) return csrfHeader;

		// 3. X-XSRF-TOKEN — URL-encoded XOR-encoded token from Axios / Angular
		const xsrfHeader = context.req.header("x-xsrf-token");
		if (xsrfHeader) {
			try {
				const urlDecoded = decodeURIComponent(xsrfHeader);
				return this.decodeToken(urlDecoded);
			} catch {
				return null;
			}
		}

		return null;
	}

	/** Validate the resolved token from the request against the session token. */
	private async tokensMatch(context: Context): Promise<boolean> {
 		const provided = await this.getResolvedToken(context);
		const stored   = Session.get<string>("_token");

		return typeof provided === "string"
			&& typeof stored === "string"
			&& provided === stored;
	}

	/**
	 * Write the XSRF-TOKEN cookie so JS frameworks can read it.
	 *
	 * The value is XOR-encoded with a fresh nonce on every response so the
	 * cookie changes each request — same underlying session token, different
	 * wire value (BREACH mitigation). Axios reads this cookie and sends it
	 * back as X-XSRF-TOKEN which the middleware decodes before comparing.
	 *
	 * - Not HttpOnly — JS must be able to read it
	 * - SameSite=Lax  — primary CSRF defence layer
	 * - Secure flag   — driven by session config (false in dev over HTTP)
	 */
	private addCookieToResponse(token: string): void {
		Cookie.setUnsigned("XSRF-TOKEN", this.encodeToken(token), {
			httpOnly: false,
			secure:   App.config.session.secure,
			sameSite: "Lax",
		});
	}

	public async boot(context: Context, next: Next) {
		if (!App.getCurrentState("is_active_session_middleware")) {
			throw new HTTPException(403, { message: "Session middleware is not active." });
		}

		// Always allow excluded paths (e.g. api/*).
		if (this.isExceptPath(context.req.path)) {
			await next();
			return;
		}

		// Ensure the session has a token before anything else.
		const sessionToken = this.ensureSessionToken();

		// Reading requests are always allowed — issue/refresh the cookie.
		if (this.isReading(context.req.method)) {
			this.addCookieToResponse(sessionToken);
			App.addToCurrentState("csrfToken", sessionToken);
			await next();
			return;
		}

		// State-changing requests: parse the body first so _token is available,
		// then validate. initializeBody() is idempotent — safe to call here even
		// if the route handler calls it again later.
		await AppRequest.initializeBody();

		if (await this.tokensMatch(context)) {
			this.addCookieToResponse(sessionToken);
			App.addToCurrentState("csrfToken", sessionToken);
			await next();
			return;
		}

		// 403 Forbidden — Hono's closest native code for a failed security check.
		throw new HTTPException(403, { message: "CSRF token mismatch." });
	}
}
