import { Context } from "hono";
import App from "../Application";

let environmentVars: Record<string, unknown> = {};

/**
 * Whether a FormData value is an uploaded file rather than a plain field.
 * Duck-typed: `File` is not a global in every Workers-compatible runtime.
 */
function isUploadedFile(value: FormDataEntryValue): value is File {
	return (
		typeof value !== "string" &&
		value !== null &&
		typeof (value as File).arrayBuffer === "function"
	);
}

/**
 * RequestData class handles HTTP request processing and data extraction.
 * Constructed from the Hono Context — the Context is the single source of truth
 * for the request. Raw Request is derived from context.req.raw.
 */
class RequestData {
	private readonly request: Request;
	private readonly context: Context;
	private requestData: Record<string, unknown> = {};
	/**
	 * Uploaded files from a multipart body, grouped by field name so that a
	 * repeated field (`name="photos[]"`) keeps every file.
	 *
	 * Held apart from requestData so all() stays JSON-serialisable; reach them
	 * with file() / files() / allFiles().
	 */
	private requestFiles: Record<string, File[]> = {};
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
				this.mergeBody(await this.request.json());
			} else if (
				contentType.includes("application/x-www-form-urlencoded") ||
				contentType.includes("multipart/form-data")
			) {
				const formData = await this.request.formData();
				const formDataObject: Record<string, string> = {};

				for (const [key, value] of formData.entries()) {
					if (isUploadedFile(value)) {
						// Keep the File itself. It was previously flattened to the
						// string `[File: name]`, which left no way to hand an upload
						// to R2FileManager.upload().
						(this.requestFiles[key] ??= []).push(value);
					} else {
						formDataObject[key] = value.toString();
					}
				}

				this.mergeBody(formDataObject);
			}
		} catch (error) {
			// Keep whatever parseUrl() collected from the query string — a body we
			// could not read is no reason to lose the query parameters too.
			console.error("Failed to parse request body:", error);
		}
	}

	/**
	 * Merge parsed body values over the data already collected from the URL.
	 *
	 * Assigning here instead of merging discarded every query parameter:
	 * parseUrl() runs in the constructor and seeds requestData with the query
	 * string, so `POST /search?page=2` with a JSON body lost `page` entirely.
	 * Body values win on a key collision, matching Laravel's input precedence.
	 *
	 * A body that is not a JSON object — a top-level array or a bare primitive —
	 * has no keys to merge and is left to `getRequest().json()`.
	 */
	private mergeBody(parsed: unknown): void {
		if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
			return;
		}

		this.requestData = { ...this.requestData, ...(parsed as Record<string, unknown>) };
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
	 * Get all request data (query params + body data).
	 * Uploaded files are not included — see allFiles().
	 */
	all(): Record<string, unknown> { 
		return this.requestData;
	}

	/**
	 * The first uploaded file for a field, or null when none was sent.
	 *
	 * Requires `await initializeBody()` first, like input() and all(). The File
	 * can be handed straight to `R2FileManager.upload()`.
	 */
	file(key: string): File | null {
		return this.requestFiles[key]?.[0] ?? null;
	}

	/**
	 * Every uploaded file for a field, for a repeated input such as
	 * `<input type="file" name="photos[]" multiple>`. Empty when none was sent.
	 */
	files(key: string): File[] {
		return [...(this.requestFiles[key] ?? [])];
	}

	/** Every uploaded file on the request, grouped by field name. */
	allFiles(): Record<string, File[]> {
		const result: Record<string, File[]> = {};
		for (const [key, files] of Object.entries(this.requestFiles)) {
			result[key] = [...files];
		}
		return result;
	}

	/** Whether the request carried at least one file for this field. */
	hasFile(key: string): boolean {
		return (this.requestFiles[key]?.length ?? 0) > 0;
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
	file:         (...args: Parameters<RequestData["file"]>)        => resolveRequest().file(...args),
	files:        (...args: Parameters<RequestData["files"]>)       => resolveRequest().files(...args),
	allFiles:     ()                                                 => resolveRequest().allFiles(),
	hasFile:      (...args: Parameters<RequestData["hasFile"]>)     => resolveRequest().hasFile(...args),
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

