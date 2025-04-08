import { CsrfTokenConfig } from "../src/type-declaration";

/**
 * not for /api/*
 * follow https://hono.dev/docs/middleware/builtin/cors#options
 * But we change the way , we added csrf token system that must be pass with form submitting
 * u can get csrf token with csrf() import {csrf} from 'flying-worker/supports
 */
export const CsrfConfig: CsrfTokenConfig = {
	origin: "same",
	except: [], // except routes
};
