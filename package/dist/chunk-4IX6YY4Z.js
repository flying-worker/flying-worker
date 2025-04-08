// src/middlewares/ReactRouter.ts
import { createRequestHandler } from "react-router";

// src/core/abstraction/BaseMiddleware.ts
var BaseMiddleware = class {
};
var BaseMiddleware_default = BaseMiddleware;

// src/middlewares/ReactRouter.ts
var ReactRouter = class extends BaseMiddleware_default {
  async boot(context, next) {
    const build = await this.getServerBuild();
    const requestHandler = createRequestHandler(
      build
    );
    return await requestHandler(context.req.raw);
  }
};
var ReactRouter_default = ReactRouter;

export {
  BaseMiddleware_default,
  ReactRouter_default
};
