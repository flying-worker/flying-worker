import { DefineRouteFunction } from '../type-declaration/route.js';
import 'hono';

type RouteDefinition = {
    path: string;
    file: string;
    middlewares: Array<string>;
};
declare const ReactRoute: (path: string, fileOrCallback: string | (() => void), middlewares?: Array<any>) => void;
declare const GetReactRoutes: () => RouteDefinition[];
declare const ReactMiddlewareByPath: (requestPath: string) => string[];
declare const applyReactRoutes: (route: DefineRouteFunction) => Promise<void>;

export { GetReactRoutes, ReactMiddlewareByPath, ReactRoute, applyReactRoutes };
