import { HTTPException } from "hono/http-exception";
import type { ZodType, ZodTypeDef } from "zod";

/**
 * Field-keyed validation messages, e.g.
 * `{ email: ["Invalid email"], "address.city": ["Required"] }`.
 */
export type ValidationErrors = Record<string, string[]>;

/**
 * Thrown when request data fails a schema.
 *
 * Extends HTTPException so Hono renders it without any extra wiring: the
 * response is 422 with a JSON body of `{ message, errors }`, the shape most
 * clients (and Inertia) already expect.
 */
export class ValidationException extends HTTPException {
	public readonly errors: ValidationErrors;

	constructor(errors: ValidationErrors, message = "The given data was invalid.") {
		super(422, {
			message,
			res: new Response(JSON.stringify({ message, errors }), {
				status: 422,
				headers: { "content-type": "application/json" },
			}),
		});

		this.name = "ValidationException";
		this.errors = errors;
	}
}

/**
 * Group Zod issues by field path.
 *
 * Nested paths are joined with dots (`address.city`) and array indexes are
 * kept (`items.0.sku`), so the key matches the input name a form would use.
 * Issues on the root object are collected under an empty key.
 */
export function toValidationErrors(
	issues: readonly { path: PropertyKey[]; message: string }[],
): ValidationErrors {
	const errors: ValidationErrors = Object.create(null);

	for (const issue of issues) {
		const key = issue.path.map(String).join(".");
		(errors[key] ??= []).push(issue.message);
	}

	return errors;
}

/**
 * Validate a plain object against a Zod schema.
 *
 * Returns the parsed value — which is the schema's output type, so coercions
 * and defaults are applied — or throws a ValidationException.
 */
export function validateData<T>(schema: ZodType<T, ZodTypeDef, unknown>, data: unknown): T {
	const result = schema.safeParse(data);

	if (!result.success) {
		throw new ValidationException(toValidationErrors(result.error.issues));
	}

	return result.data;
}

/** Validate data with schemas that may contain async refinements or transforms. */
export async function validateDataAsync<T>(
	schema: ZodType<T, ZodTypeDef, unknown>,
	data: unknown,
): Promise<T> {
	const result = await schema.safeParseAsync(data);

	if (!result.success) {
		throw new ValidationException(toValidationErrors(result.error.issues));
	}

	return result.data;
}
