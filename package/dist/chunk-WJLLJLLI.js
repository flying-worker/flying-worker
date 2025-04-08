// src/route/Route.ts
var RouteManager = class {
  constructor() {
    this.routes = [];
    this.groupPrefix = "";
    // Prefix for route groups
    this.groupMiddlewares = [];
  }
  // Middlewares applied to a group
  add(method, path, handler, middlewares = []) {
    let fn;
    if (Array.isArray(handler)) {
      const [ClassRef, methodName] = handler;
      const instance = new ClassRef();
      fn = instance[methodName].bind(instance);
    } else {
      fn = handler;
    }
    const finalPath = this.groupPrefix + path;
    const finalMiddlewares = [...this.groupMiddlewares, ...middlewares];
    this.routes.push({
      method,
      path: finalPath,
      handler: fn,
      middlewares: finalMiddlewares
    });
  }
  group(prefix, callback, middlewares = []) {
    const prevPrefix = this.groupPrefix;
    const prevMiddlewares = this.groupMiddlewares;
    this.groupPrefix = prevPrefix + prefix;
    this.groupMiddlewares = [...prevMiddlewares, ...middlewares];
    callback();
    this.groupPrefix = prevPrefix;
    this.groupMiddlewares = prevMiddlewares;
  }
  getRoutes() {
    return this.routes;
  }
  get(path, handler, middlewares = []) {
    this.add("get", path, handler, middlewares);
  }
  post(path, handler, middlewares = []) {
    this.add("post", path, handler, middlewares);
  }
  put(path, handler, middlewares = []) {
    this.add("put", path, handler, middlewares);
  }
  delete(path, handler, middlewares = []) {
    this.add("delete", path, handler, middlewares);
  }
  reset() {
    this.routes = [];
  }
  all(path, handler, middlewares = []) {
    this.add("all", path, handler, middlewares);
  }
};
var Route = new RouteManager();
var Route_default = Route;

export {
  Route_default
};
