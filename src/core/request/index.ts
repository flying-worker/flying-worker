import { Context } from "hono";

let environmentVars: Record<string, unknown> = {};

class RequestData {
	private readonly request: Request;
	private requestData: Record<string, unknown> = {};
	private headers: Record<string, string> = {};
	private context!: Context;

	constructor(request: Request) {
		this.request = request;
		this.init(request).then((r) => "done");
	}

	private async init(request: Request) {
		if (["POST", "PUT", "PATCH"].includes(request.method)) {
			const contentType = request.headers.get("content-type");
			if (contentType?.includes("application/json")) {
				this.requestData = await request.json();
			} else if (
				contentType?.includes("application/x-www-form-urlencoded") ||
				contentType?.includes("multipart/form-data")
			) {
				const formData = await request.formData();
				// @ts-ignore
				this.requestData = Object.fromEntries(formData.entries());
			}
		}

		// Merge query parameters
		const url = new URL(request.url);
		const queryParams = Object.fromEntries(url.searchParams.entries());
		this.requestData = { ...queryParams, ...this.requestData };

		// Store headers
		this.headers = {};
		request.headers.forEach((value, key) => {
			this.headers[key.toLowerCase()] = value;
		});
	}

	all() {
		return this.requestData;
	}

	setContext(context: Context) {
		this.context = context;
	}

	getContext(): Context {
		return this.context;
	}

	input(key: string, defaultValue: unknown = null): any {
		return this.requestData[key] ?? defaultValue;
	}

	get(key: string, defaultValue: unknown = null) {
		return this.requestData[key] ?? defaultValue;
	}

	getRequest(): Request {
		return this.request;
	}

	header(key: string, defaultValue = "") {
		return this.headers[key.toLowerCase()] ?? defaultValue;
	}

	allHeaders() {
		return this.headers;
	}

	isMethod(method: string) {
		return this.request.method.toLowerCase() === method.toLowerCase();
	}

	ip() {
		return (
			this.header("x-forwarded-for")?.split(",")[0] ||
			this.header("x-real-ip") ||
			"127.0.0.1"
		);
	}
}

export let Request: RequestData;

export function setEnv(env: Record<string, unknown>) {
	environmentVars = env;
}

export function getEnv(key: string, defaultValue: unknown = ""): any {
	return environmentVars[key] ?? defaultValue;
}

export function setRequest(request: Request) {
	Request = new RequestData(request);
}
