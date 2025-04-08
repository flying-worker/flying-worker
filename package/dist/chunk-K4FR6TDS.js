// src/route/ReactRoute.ts
var routes = /* @__PURE__ */ new Map();
var parentPaths = [];
var parentMiddlewares = [];
var convertPath = (path) => {
  return path.replace(/^(\.?\/)?resources\/react\//, "");
};
var buildFullPath = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (parentPaths.length === 0) {
    return normalized;
  }
  const fullPath = `${parentPaths.join("")}${normalized}`;
  return fullPath.replace(/\/+/g, "/");
};
var normalizePath = (path) => {
  if (!path) return "";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
};
var isParameterMatch = (routePath, requestPath) => {
  const routeSegments = normalizePath(routePath).split("/").filter(Boolean);
  const requestSegments = requestPath.split("/").filter(Boolean);
  if (requestSegments.length !== routeSegments.length) return false;
  return routeSegments.every((segment, index) => {
    if (segment.startsWith(":")) return true;
    return segment === requestSegments[index];
  });
};
var ReactRoutes = (path, fileOrCallback, middlewares = []) => {
  const currentPath = buildFullPath(path);
  const currentMiddlewares = [...parentMiddlewares.flat(), ...middlewares];
  if (typeof fileOrCallback === "string") {
    if (currentPath && routes.has(currentPath)) {
      const existingRoute = routes.get(currentPath);
      if (existingRoute) {
        const mergedMiddlewares = [
          .../* @__PURE__ */ new Set([...existingRoute.middlewares, ...currentMiddlewares])
        ];
        routes.set(currentPath, {
          path: currentPath,
          file: convertPath(fileOrCallback),
          middlewares: mergedMiddlewares
        });
      }
    } else {
      routes.set(currentPath, {
        path: currentPath,
        file: convertPath(fileOrCallback),
        middlewares: currentMiddlewares
      });
    }
  } else {
    parentPaths.push(currentPath);
    parentMiddlewares.push(...middlewares);
    fileOrCallback();
    parentMiddlewares.pop();
    parentPaths.pop();
  }
};
var getRoutes = () => {
  return Array.from(routes.values()).map((route) => ({
    ...route,
    path: route.path.length > 1 ? route.path.replace(/\/$/, "") : route.path
  }));
};
var matchMiddlewares = (requestPath) => {
  const normalizedPath = normalizePath(requestPath);
  return Array.from(routes.values()).filter((route) => {
    return route.middlewares.length > 0 && (normalizePath(route.path) === normalizedPath || isParameterMatch(route.path, normalizedPath));
  }).flatMap((route) => route.middlewares);
};
var ReactRoute = ReactRoutes;
var GetReactRoutes = getRoutes;
var ReactMiddlewareByPath = matchMiddlewares;
var applyReactRoutes = async (route) => {
  try {
    const routes2 = GetReactRoutes();
    for (const singleRoute of routes2) {
      route(singleRoute.path, singleRoute.file);
    }
  } catch (error) {
    throw new Error(`Error loading route: ${error.message}`);
  }
};

export {
  ReactRoute,
  GetReactRoutes,
  ReactMiddlewareByPath,
  applyReactRoutes
};
