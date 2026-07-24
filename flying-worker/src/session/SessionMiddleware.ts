import type { Context, Next } from "hono";
import { Session } from "./index";

export async function sessionMiddleware(context: Context, next: Next): Promise<void> {
	await Session.initialize();
	await next();
	await Session.save();
}

