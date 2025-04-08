import { ReactRouterMiddlewareApply } from "../src/middlewares";

class RemixMiddleware extends ReactRouterMiddlewareApply {
	public async loadRoutes() {
		// @ts-ignore
		await import("../routes/web");
	}
}

export default RemixMiddleware;
