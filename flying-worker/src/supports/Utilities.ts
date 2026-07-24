import { App } from "../core";

/**
 * Return the raw CSRF session token for use in HTML forms and meta tags.
 *
 * Use this value for:
 *   - <input type="hidden" name="_token" value={csrfToken()} />
 *   - <meta name="csrf-token" content={csrfToken()} />
 *
 * Do NOT use this value for the XSRF-TOKEN cookie — the middleware handles
 * that automatically by XOR-encoding it with a per-request nonce so the
 * cookie value changes on every response (BREACH mitigation) while this
 * raw value remains stable for the session lifetime, matching Laravel's
 * csrf_token() behaviour.
 */
export const csrfToken = (): string => {
	return App.getCurrentState("csrfToken") ?? "";
};


export function sanitizeSQLInput(value: any): string {
	if (value === null || value === undefined) return "NULL";

	if (typeof value === "number") {
		if (isNaN(value)) return "NULL";
		return value.toString();
	}

	if (typeof value === "boolean") return value ? "1" : "0";

	if (typeof value === "string") {
		const escaped = value
			.replace(/\\/g, '\\\\')     // Escape backslashes
			.replace(/'/g, "''")        // Escape single quotes
			.replace(/--/g, '')         // Remove comment indicators
			.replace(/;/g, '')          // Remove semicolons
			.replace(/\/\*/g, '')       // Remove block comment start
			.replace(/\*\//g, '');      // Remove block comment end

		return `'${escaped}'`;
	}

	// Optionally reject unsupported types
	if (typeof value === "symbol" || typeof value === "bigint" || typeof value === "function") {
		throw new Error(`Unsupported SQL input type: ${typeof value}`);
	}

	// Default: stringify and sanitize
	const stringValue = String(value)
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "''")
		.replace(/--/g, '')
		.replace(/;/g, '')
		.replace(/\/\*/g, '')
		.replace(/\*\//g, '');

	return `'${stringValue}'`;
}
