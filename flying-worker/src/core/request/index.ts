import { Context } from "hono";
import type { ZodType } from "zod";
import App from "../Application";
import { validateData } from "../../validation";

let environmentVars: Record<string, unknown> = {};

/**
 * RequestData class handles HTTP request processing and data extraction.
 * Constructed from the Hono Context — the Context is the single source of truth
 * for the request. Raw Request is derived from context.req.raw.
 */
class RequestData {
	private readonly request: Request;
	private readonly context: Context;
	private requestData: Record<string, unknown> = {};
	private headers: Record<string, string> = {};
	private baseUrl: string = "";
	private path: string = "";
	private initialized: boolean = false;

	/**
	 * Guards against parsing the request body more than once.
	 * The body stream (json/formData) can only be consumed once — a second
	 * read throws. This flag makes initializeBody() idempotent so it is safe
	 * to call from middleware (e.g. CSRF) and again from a route handler.
	 */
	private bodyInitialized: boolean = false;

	constructor(context: Context) {
		this.context = context;
		this.request = context.req.raw;
		this.initialize();
	}

	/**
	 * Initialize request data synchronously
	 * Parses URL, headers, and query parameters immediately
	 * Body parsing is done separately via initializeBody() for async operations
	 */
	private initialize(): void {
		if (this.initialized) return;

		try {
			this.parseUrl();
			this.parseHeaders();
			this.initialized = true;
		} catch (error) {
			console.error("Failed to initialize request data:", error);
			throw new Error("Request initialization failed");
		}
	}

	/**
	 * Initialize request body data asynchronously
	 * Must be called separately for requests with body content
	 */
	async initializeBody(): Promise<void> {
		if (this.bodyInitialized) return;
		try {
			await this.parseRequestBody();
			this.bodyInitialized = true;
		} catch (error) {
			console.error("Failed to initialize request body:", error);
			throw new Error("Request body initialization failed");
		}
	}

	/**
	 * Parse request body based on content type
	 */
	private async parseRequestBody(): Promise<void> {
		if (!["POST", "PUT", "PATCH"].includes(this.request.method)) {
			return;
		}

		const contentType = this.request.headers.get("content-type") || "";

		try {
			if (contentType.includes("application/json")) {
				this.requestData = await this.request.json();
			} else if (
				contentType.includes("application/x-www-form-urlencoded") ||
				contentType.includes("multipart/form-data")
			) {
				const formData = await this.request.formData();
				const formDataObject: Record<string, string> = {};
				
				for (const [key, value] of formData.entries()) {
					// Handle File objects and convert to string representation
					if (typeof value === 'object' && value !== null && 'name' in value) {
						formDataObject[key] = `[File: ${(value as any).name}]`;
					} else {
						formDataObject[key] = value.toString();
					}
				}
				
				this.requestData = formDataObject;
			}
		} catch (error) {
			console.error("Failed to parse request body:", error);
			this.requestData = {};
		}
	}

	/**
	 * Parse URL and extract query parameters
	 */
	private parseUrl(): void {
		try {
			const url = new URL(this.request.url);
			
			// Extract query parameters
			const queryParams = Object.fromEntries(url.searchParams.entries());
			this.requestData = { ...queryParams, ...this.requestData };

			// Set base URL and path
			this.baseUrl = `${url.protocol}//${url.host}`;
			this.path = url.pathname;
		} catch (error) {
			console.error("Failed to parse URL:", error);
			// Fallback for invalid URLs
			this.baseUrl = "";
			this.path = "/";
		}
	}

	/**
	 * Parse and store request headers
	 */
	private parseHeaders(): void {
		this.headers = {};
		this.request.headers.forEach((value, key) => {
			this.headers[key.toLowerCase()] = value;
		});
	}


	/**
	 * Get all request data (query params + body data)
	 */
	all(): Record<string, unknown> { 
		return this.requestData;
	}

	/**
	 * Validate the request against a Zod schema.
	 *
	 * Reads the body first, so there is no separate initializeBody() call to
	 * forget, then validates the query parameters and body together. Returns
	 * the parsed value — the schema's output type, so coercions and defaults
	 * are applied — or throws a ValidationException, which Hono renders as 422
	 * with a `{ message, errors }` body.
	 *
	 *     const { email, password } = await AppRequest.validate(
	 *       z.object({ email: z.string().email(), password: z.string().min(8) }),
	 *     );
	 */
	async validate<T>(schema: ZodType<T>): Promise<T> {
		await this.initializeBody();

		return validateData(schema, this.all());
	}

	/**
	 * Get the Hono context
	 */
	getContext(): Context {
		return this.context;
	}

	/**
	 * Get input value by key with optional default
	 */
	input(key: string, defaultValue: any = ''): any { 
		return this.requestData[key] ?? defaultValue;
	}

	/**
	 * Alias for input method
	 */
	get(key: string, defaultValue: unknown = null): unknown {
		return this.input(key, defaultValue);
	}

	/**
	 * Get the original request object
	 */
	getRequest(): Request {
		return this.request;
	}

	/**
	 * Get header value by key with optional default
	 */
	header(key: string, defaultValue: string = ""): string { 
		return this.headers[key.toLowerCase()] ?? defaultValue;
	}

	/**
	 * Get all headers
	 */
	allHeaders(): Record<string, string> { 
		return { ...this.headers };
	}

	/**
	 * Check if request method matches
	 */
	isMethod(method: string): boolean {
		return this.request.method.toLowerCase() === method.toLowerCase();
	}

	/**
	 * Get client IP address
	 */
	ip(): string { 
		const forwardedFor = this.header("x-forwarded-for");
		if (forwardedFor) {
			return forwardedFor.split(",")[0].trim();
		}
		return this.header("x-real-ip") || "127.0.0.1";
	}

	/**
	 * Get URL without query parameters (protocol + host + path)
	 */
	url(): string {
		try {
			const url = new URL(this.request.url);
			return `${url.protocol}//${url.host}${url.pathname}`;
		} catch (error) {
			return this.baseUrl + this.path;
		}
	}

	/**
	 * Alias for url() - Get the complete full URL
	 */
	fullurl(): string {
		return this.request.url;
	}

	/**
	 * Get the base URL (protocol + host) without path
	 */
	getBaseUrl(): string {
		return this.baseUrl;
	}

	/**
	 * Get request path (pathname without query parameters)
	 */
	pathname(): string { 
		return this.path;
	}

	/**
	 * Get URI (path + query string if present)
	 */
	uri(): string {
		try {
			const url = new URL(this.request.url);
			return url.pathname + url.search;
		} catch (error) {
			return this.path;
		}
	}

	/**
	 * Check if request is initialized
	 */
	isInitialized(): boolean {
		return this.initialized;
	}
}

/**
 * Set environment variables
 */
export function setEnv(env: Record<string, unknown>): void {
	environmentVars = { ...env };
}

/**
 * Get environment variable with optional default
 */
export function getEnv(key: string, defaultValue: unknown = ""): unknown {
	return environmentVars[key] ?? defaultValue;
}

/**
 * Resolve the RequestData instance from the per-request DI container.
 * Constructed from App.getContext() so the Hono Context is the single
 * source of truth — no global request singleton, no setRequest() at entry.
 *
 * NOTE: The per-request container lives in an AsyncLocalStorage store opened
 * by basicInit() (see Application.ts). Each request — sequential or concurrent
 * within the same isolate — resolves its own container/context from that store,
 * so RequestData is always bound to the correct request.
 */
export const resolveRequest = (): RequestData => {
	return App.getContainer().resolve("Request", () => {
		return new RequestData(App.getContext());
	});
};

/**
 * AppRequest facade — mirrors the Auth facade pattern.
 * Every method lazily resolves the RequestData from the container,
 * so it is always bound to the current request's Hono Context.
 *
 * For requests with a body (POST/PUT/PATCH), call:
 *   await AppRequest.initializeBody()
 * before reading input() / all().
 */
export const AppRequest = {
	input:        (...args: Parameters<RequestData["input"]>)       => resolveRequest().input(...args),
	get:          (...args: Parameters<RequestData["get"]>)         => resolveRequest().get(...args),
	all:          ()                                                 => resolveRequest().all(),
	validate:     <T>(schema: ZodType<T>)                            => resolveRequest().validate(schema),
	header:       (...args: Parameters<RequestData["header"]>)      => resolveRequest().header(...args),
	allHeaders:   ()                                                 => resolveRequest().allHeaders(),
	isMethod:     (...args: Parameters<RequestData["isMethod"]>)    => resolveRequest().isMethod(...args),
	ip:           ()                                                 => resolveRequest().ip(),
	url:          ()                                                 => resolveRequest().url(),
	fullurl:      ()                                                 => resolveRequest().fullurl(),
	getBaseUrl:   ()                                                 => resolveRequest().getBaseUrl(),
	pathname:     ()                                                 => resolveRequest().pathname(),
	uri:          ()                                                 => resolveRequest().uri(),
	getContext:   ()                                                 => resolveRequest().getContext(),
	getRequest:   ()                                                 => resolveRequest().getRequest(),
	initializeBody: ()                                               => resolveRequest().initializeBody(),
	isInitialized:  ()                                               => resolveRequest().isInitialized(),
};

