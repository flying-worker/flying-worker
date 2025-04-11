// @ts-ignore
import { type RouteConfig } from "@react-router/dev/routes";
import {
	DefineRoutesFunction,
	remixRoutesOptionAdapter,
} from "@react-router/remix-routes-option-adapter";
import { applyReactRoutes } from "../../src/route";
import { type DefineRouteFunction } from "../../src/type-declaration";

export default remixRoutesOptionAdapter(
	async (defineRoutes: DefineRoutesFunction) => {
		await import("../../routes/react");

		return defineRoutes(async (route: DefineRouteFunction) => {
			await applyReactRoutes(route);

			// route("/", "pages/Index.tsx", { index: true });
		});
	},
) satisfies RouteConfig;
