import { ReactRouter } from "../src/middlewares";

class RemixRegister extends ReactRouter {
	public async getServerBuild() {
		// @ts-ignore
		return await import("../build/server");
	}
}

export default RemixRegister;
