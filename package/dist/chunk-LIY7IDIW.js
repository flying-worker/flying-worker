import {
  AuthUserSchema,
  JwtTokenPayloadSchema
} from "./chunk-JDILM5QH.js";
import {
  JwtGuardConfigSchema
} from "./chunk-TS3PSECT.js";
import {
  Str
} from "./chunk-WMP6M3KL.js";
import {
  ReactMiddlewareByPath
} from "./chunk-K4FR6TDS.js";
import {
  Route_default
} from "./chunk-WJLLJLLI.js";
import {
  BaseMiddleware_default
} from "./chunk-4IX6YY4Z.js";

// src/middlewares/Cors.ts
import { cors } from "hono/cors";

// src/core/Application.ts
import { Hono } from "hono";

// src/cookie/index.ts
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
function parseLifetime(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error("Invalid duration format");
  const value = Number.parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      throw new Error("Invalid duration unit");
  }
}
var Cookie = {
  set: (name, value, maxAge = null) => {
    const maxAgeValue = maxAge != null ? maxAge : Application_default.config.session.lifetime;
    let expiresInSeconds = typeof maxAgeValue === "string" ? parseLifetime(maxAgeValue) : maxAgeValue;
    setSignedCookie(Request.getContext(), name, value, Application_default.config.app.secret, {
      path: Application_default.config.session.path,
      secure: Application_default.config.session.secure,
      httpOnly: Application_default.config.session.httpOnly,
      maxAge: expiresInSeconds,
      sameSite: Application_default.config.session.sameSite
    }).then();
  },
  get: async (name) => {
    const data = await getSignedCookie(
      Request.getContext(),
      Application_default.config.app.secret,
      name
    );
    return data;
  },
  delete: (name) => {
    deleteCookie(Request.getContext(), name);
  }
};

// src/supports/Encrypt.ts
import bcrypt from "bcryptjs";
import { sign, verify } from "hono/jwt";
var passwordHash = async (password) => {
  return await bcrypt.hash(password, 10);
};
var passwordVerify = async (password, userPassword) => {
  return await bcrypt.compare(password, userPassword);
};
var encrypt = async (data) => {
  return await sign({ data }, Application_default.config.app.secret);
};
var decrypt = async (token) => {
  var _a;
  const data = await verify(token, Application_default.config.app.secret);
  return (_a = data == null ? void 0 : data.data) != null ? _a : null;
};

// src/supports/Utilities.ts
var csrfToken = () => {
  var _a;
  return (_a = Application_default.getCurrentState("csrfToken")) != null ? _a : "";
};

// src/middlewares/CsrfToken.ts
var CsrfToken = class extends BaseMiddleware_default {
  constructor() {
    super(...arguments);
    this.isExceptPath = (path) => {
      return Application_default.config.csrf.except.some((pattern) => {
        if (pattern.endsWith("*")) {
          return path.startsWith(pattern.slice(0, -1));
        }
        return path === pattern;
      });
    };
  }
  async boot(context, next) {
    let tokenSuccess = true;
    if (!context.req.path.startsWith("api") && !this.isExceptPath(context.req.path)) {
      if (["POST", "PUT", "DELETE", "PATCH"].includes(context.req.method)) {
        let csrfToken2 = context.req.header("X-CSRF-TOKEN");
        if (!csrfToken2) {
          csrfToken2 = Request.input("csrf_token");
        }
        const tokenFromCookie = await Cookie.get("X-CSRF-TOKEN");
        if (csrfToken2 && tokenFromCookie) {
          if (tokenFromCookie !== csrfToken2) {
            tokenSuccess = false;
          }
        } else {
          tokenSuccess = false;
        }
      }
    }
    const now = Date.now() / 1e3 | 0;
    const newToken = await encrypt(now);
    Cookie.set("X-CSRF-TOKEN", newToken);
    Application_default.addToCurrentState("csrfToken", newToken);
    if (!tokenSuccess) {
      return context.json({ error: "CSRF token mismatch" }, 403);
    }
    await next();
  }
};

// src/middlewares/JwtAuth.ts
import { HTTPException } from "hono/http-exception";
import { jwt } from "hono/jwt";
var JwtAuth = class extends BaseMiddleware_default {
  constructor() {
    super(...arguments);
    this.guard = null;
  }
  setGuard(guard) {
    if (guard) {
      this.guard = guard;
    }
  }
  async boot(context, next) {
    var _a;
    const currentGuard = (_a = this.guard) != null ? _a : "api";
    const jwtConfig = Application_default.config.auth.guards[currentGuard];
    if (!(jwtConfig == null ? void 0 : jwtConfig.useCookie)) {
      throw new HTTPException(500, { message: "Invalid jwt guard" });
    }
    let options = { secret: Application_default.config.app.secret };
    if (jwtConfig.useCookie.status) {
      options.cookie = {
        key: jwtConfig.useCookie.key,
        secret: Application_default.config.app.secret
      };
    }
    return jwt(options)(context, next);
  }
};
var JwtAuth_default = JwtAuth;

// src/middlewares/MaintenanceMode.ts
var MaintenanceMode = class extends BaseMiddleware_default {
  async boot(context, next) {
    if (Application_default.config.app.maintenance.status) {
      return context.html(Application_default.config.app.maintenance.message);
    }
    await next();
  }
};
var MaintenanceMode_default = MaintenanceMode;

// src/middlewares/ReactRouterMiddlewareApply.ts
var ReactRouteMiddlewareApply = class extends BaseMiddleware_default {
  async boot(context, next) {
    await this.loadRoutes();
    const pathname = new URL(context.req.url).pathname;
    const matchedMiddleware = ReactMiddlewareByPath(pathname);
    if (matchedMiddleware.length) {
      for (const alias of matchedMiddleware) {
        const middleware = Application_default.config.middlewares.aliases[alias];
        const instance = new middleware();
        const result = await instance.boot(context, async () => {
          return;
        });
        if (result !== void 0) {
          return result;
        }
      }
    }
    return await next();
  }
};
var ReactRouterMiddlewareApply_default = ReactRouteMiddlewareApply;

// src/middlewares/Session.ts
import { workerKVSession } from "remix-hono/cloudflare";
var Session = class extends BaseMiddleware_default {
  constructor() {
    super(...arguments);
    this.isAvoidPath = (path) => {
      return Application_default.config.session.avoidPath.some((pattern) => {
        if (pattern.endsWith("*")) {
          return path.startsWith(pattern.slice(0, -1));
        }
        return path === pattern;
      });
    };
  }
  async boot(context, next) {
    if (!this.isAvoidPath(context.req.path)) {
      const secret = Application_default.config.app.secret;
      const rememberLogin = await Cookie.get("remember_login");
      if (rememberLogin) {
        Cookie.set("remember_login", rememberLogin, "30d");
      }
      return await workerKVSession({
        autoCommit: true,
        cookie: {
          name: Application_default.config.session.cookie,
          secrets() {
            return [secret];
          },
          secure: Application_default.config.session.secure,
          domain: Application_default.config.session.domain,
          httpOnly: Application_default.config.session.httpOnly,
          sameSite: Application_default.config.session.sameSite,
          path: Application_default.config.session.path,
          maxAge: rememberLogin ? 30 * 24 * 60 * 60 : Application_default.config.session.lifetime * 60
        },
        binding: Application_default.config.session.driver
      })(context, next);
    }
  }
};

// src/middlewares/SessionAuth.ts
import { HTTPException as HTTPException3 } from "hono/http-exception";

// src/auth/ApiAuth.ts
import { eq } from "drizzle-orm";
import { HTTPException as HTTPException2 } from "hono/http-exception";
import { sign as sign2 } from "hono/jwt";

// src/database/index.ts
function DB(connection) {
  const type = connection || Application_default.config.db.default;
  if (type && Application_default.config.db.connections[type]) {
    return Application_default.config.db.connections[type].connection();
  }
  throw new Error(`Unsupported database connection: ${type}`);
}

// src/auth/ApiAuth.ts
var JwtAuthManager = class {
  async createToken(payload) {
    var _a, _b, _c;
    JwtTokenPayloadSchema.parse(payload);
    const now = Date.now() / 1e3 | 0;
    let currentGuard = (_a = payload == null ? void 0 : payload.guard) != null ? _a : "api";
    const currentGuardData = this.getCurrentGuardData(currentGuard);
    let maxAge = (_b = payload.maxAge) != null ? _b : currentGuardData.useCookie.maxAge;
    let maxAgeInSeconds = typeof maxAge === "string" ? parseLifetime(maxAge) : maxAge;
    const expiresAtInSeconds = now + maxAgeInSeconds;
    payload.expiresInDays = void 0;
    if (currentGuardData.userModel) {
      const userFromDatabase = await DB().select().from(currentGuardData.userModel).where(eq(currentGuardData.userModel.id, payload.user.id)).get();
      if (!(userFromDatabase == null ? void 0 : userFromDatabase.id)) {
        throw new Error("User not found");
      }
    }
    const finalPayload = {
      ...payload,
      exp: expiresAtInSeconds,
      guard: currentGuard
    };
    const token = await sign2(finalPayload, Application_default.config.app.secret);
    const tokenModel = currentGuardData.tokenModel;
    if (tokenModel) {
      const dbConnection = DB();
      await dbConnection.insert(tokenModel).values({
        user_id: payload.user.id,
        name: payload == null ? void 0 : payload.name,
        token,
        permissions: JSON.stringify((_c = payload.permissions) != null ? _c : []),
        expires_at: expiresAtInSeconds
      });
    }
    if (currentGuardData.useCookie.status) {
      Cookie.set(currentGuardData.useCookie.key, token, maxAge);
    }
    return token;
  }
  async delete(deleteAll = false) {
    var _a;
    const payload = Request.getContext().get("jwtPayload");
    if (!payload) {
      return;
    }
    const currentGuardData = this.getCurrentGuardData();
    const finalGuard = (_a = payload == null ? void 0 : payload.guard) != null ? _a : "api";
    const token = await this.getToken(finalGuard);
    if (token) {
      const tokenModel = currentGuardData.tokenModel;
      if (tokenModel && !deleteAll) {
        await DB().delete(tokenModel).where(eq(tokenModel.token, token));
      }
      if (tokenModel && deleteAll) {
        const tokenData = await DB().select().from(tokenModel).where(eq(tokenModel.token, token)).get();
        if (tokenData) {
          await DB().delete(tokenModel).where(eq(tokenModel.user_id, tokenData.user_id));
        }
      }
    }
  }
  check() {
    return !!Request.getContext().get("jwtPayload");
  }
  async user(guard) {
    let currentGuard = guard != null ? guard : "api";
    const currentGuardData = this.getCurrentGuardData(currentGuard);
    if (Application_default.getCurrentState("authUser")) {
      return Application_default.getCurrentState("authUser");
    }
    if (!Application_default.getCurrentState("authUser")) {
      const payload = Request.getContext().get("jwtPayload");
      if (!payload) {
        return null;
      }
      await this.setUser(payload, currentGuardData, currentGuard);
    }
    return Application_default.getCurrentState("authUser");
  }
  async getToken(guard) {
    const credentials = Request.getContext().req.raw.headers.get("Authorization");
    if (credentials) {
      const parts = credentials.split(/\s+/);
      const token2 = parts[1] || null;
      if (token2) {
        return token2;
      }
    }
    const data = Application_default.config.auth.guards[guard != null ? guard : "api"];
    const token = await Cookie.get(data.useCookie.key);
    if (token) {
      return token;
    }
    return null;
  }
  getCurrentGuardData(guard) {
    var _a, _b;
    const payload = Request.getContext().get("jwtPayload");
    const finalGuard = (_b = (_a = payload == null ? void 0 : payload.guard) != null ? _a : guard) != null ? _b : "api";
    if (finalGuard) {
      JwtGuardConfigSchema.parse(Application_default.config.auth.guards[finalGuard]);
      return Application_default.config.auth.guards[finalGuard];
    }
    throw new Error("Guard is invalid");
  }
  async formatUserData(data, guardData) {
    const RolePermissionModel = guardData == null ? void 0 : guardData.rolePermissionModel;
    let rolePermissionData = [];
    if (RolePermissionModel) {
      const rolePermissions = await DB().select().from(RolePermissionModel).where(eq(RolePermissionModel.user_id, data.user.id)).all();
      if (rolePermissions.length > 0) {
        for (const item of rolePermissions) {
          rolePermissionData.push({
            id: Number.parseInt(item.id),
            role: item.role,
            permissions: item.permissions ? JSON.parse(item.permissions) : []
          });
        }
      }
    } else {
      if (data.user.rolePermissions) {
        rolePermissionData = data.user.rolePermissions;
      }
    }
    return {
      ...data.user,
      tokenPermissions: data.permissions,
      rolePermissions: rolePermissionData,
      hasRole: this.hasRole,
      hasPermission: this.hasPermission,
      hasTokenPermission: this.hasTokenPermission
    };
  }
  hasRole(role) {
    var _a;
    const roles = Array.isArray(role) ? role : [role];
    if ((_a = Application_default.getCurrentState("authUser")) == null ? void 0 : _a.rolePermissions) {
      return Application_default.getCurrentState("authUser").rolePermissions.some(
        (item) => roles.includes(item.role)
      );
    }
    return false;
  }
  hasPermission(permission) {
    var _a, _b;
    const permissions = Array.isArray(permission) ? permission : [permission];
    if ((_a = Application_default.getCurrentState("authUser")) == null ? void 0 : _a.rolePermissions) {
      return (_b = Application_default.getCurrentState("authUser")) == null ? void 0 : _b.rolePermissions.some(
        (item) => permissions.every((perm) => item.permissions.includes(perm))
      );
    }
    return false;
  }
  hasTokenPermission(permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const authUser = Application_default.getCurrentState("authUser");
    if (!authUser || !Array.isArray(authUser == null ? void 0 : authUser.tokenPermissions)) {
      return false;
    }
    return permissions.every((p) => authUser.tokenPermissions.includes(p));
  }
  async setUser(data, guardData, currentGuard) {
    const userModel = guardData.userModel;
    if (userModel) {
      const userFromDatabase = await DB().select().from(userModel).where(eq(userModel.id, data.user.id)).get();
      if (!userFromDatabase) {
        throw new HTTPException2(401, {
          message: "User not found"
        });
      }
      if (userFromDatabase.password) {
        userFromDatabase.password = void 0;
      }
      if (userFromDatabase.remember_token) {
        userFromDatabase.remember_token = void 0;
      }
      data.user = {
        id: userFromDatabase.id,
        name: userFromDatabase.name,
        email: userFromDatabase.email,
        ...userFromDatabase
      };
    }
    if (guardData.tokenModel) {
      const AuthToken = await this.getToken(currentGuard != null ? currentGuard : "api");
      const token = await DB().select().from(guardData.tokenModel).where(eq(guardData.tokenModel.token, AuthToken)).get();
      if (!token) {
        throw new HTTPException2(401, {
          message: "Invalid Token"
        });
      }
    }
    const userData = await this.formatUserData(data, guardData);
    Application_default.addToCurrentState("authUser", userData);
  }
};
var JwtAuth2 = new JwtAuthManager();
var ApiAuth_default = JwtAuth2;

// src/auth/Auth.ts
import { and, eq as eq2 } from "drizzle-orm";

// src/session/Session.ts
import { getSession, getSessionStorage } from "remix-hono/session";
var SessionManager = class {
  getSession() {
    if (!this.session) {
      this.session = getSession(Request.getContext());
    }
    return this.session;
  }
  getStorage() {
    if (!this.sessionStorage) {
      this.sessionStorage = getSessionStorage(Request.getContext());
    }
    return this.sessionStorage;
  }
  get(key, defaultValue = "") {
    const data = this.getSession().get(key);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.value;
    }
    return defaultValue;
  }
  set(key, value) {
    const data = JSON.stringify({ value, type: typeof value });
    this.getSession().set(key, data);
  }
  async destroy() {
    await this.getStorage().destroySession(this.getSession());
  }
  rawData() {
    return this.getSession().data;
  }
  flash(key, value) {
    const data = JSON.stringify({ value, type: typeof value });
    this.getSession().flash(key, data);
  }
  forget(key) {
    this.getSession().unset(key);
  }
  has(key) {
    const data = this.getSession().get(key);
    return !!data;
  }
};
var Session2 = new SessionManager();

// src/auth/Auth.ts
var AuthManager = class {
  async logout() {
    await this.regenerateSession();
    Cookie.delete("remember_login");
  }
  async regenerateSession() {
    if (Session2.getSession().id) {
      const sessionData = Session2.rawData();
      for (const key in sessionData) {
        Session2.forget(key);
      }
      await Session2.destroy();
    }
  }
  async login(user, remember = false) {
    AuthUserSchema.parse(user);
    await this.regenerateSession();
    const key = this.sessionKey();
    Session2.set(key, { guard: Application_default.config.auth.defaultGuard, userId: user.id });
    Application_default.addToCurrentState("authUser", await this.formatUserData(user));
    Request.getContext().header(
      "set-cookie",
      await Session2.getStorage().commitSession(Session2.getSession(), {
        maxAge: 30 * 24 * 60 * 60
        // 30 days
      }),
      {
        append: true
      }
    );
    if (remember) {
      Cookie.set("remember_login", user.id.toString(), "30d");
    } else {
      Cookie.delete("remember_login");
    }
  }
  async attempt(credentials, remember = false) {
    const userModel = Application_default.config.auth.guards[Application_default.config.auth.defaultGuard].userModel;
    if (!userModel) {
      throw new Error("Auth model not set in config/app.ts");
    }
    let conditions = [];
    let password = "";
    for (const [key, value] of Object.entries(credentials)) {
      if (key === "password") {
        password = value;
        continue;
      }
      if (value) {
        conditions.push(eq2(userModel[key], value));
      }
    }
    const user = await DB().select().from(userModel).where(conditions.length > 0 ? and(...conditions) : void 0).get();
    if (!user) {
      return false;
    }
    if (password) {
      const verify2 = await passwordVerify(password, user.password);
      if (!verify2) {
        return false;
      }
    }
    try {
      await this.login(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          ...user
        },
        remember
      );
    } catch (error) {
      return false;
    }
    return true;
  }
  check(guard) {
    const currentGuard = guard != null ? guard : Application_default.config.auth.defaultGuard;
    const key = this.sessionKey();
    const authData = Session2.get(key);
    return !!(authData && authData.guard === currentGuard);
  }
  async user() {
    if (Application_default.getCurrentState("authUser")) {
      return Application_default.getCurrentState("authUser");
    }
    const key = this.sessionKey();
    const authData = Session2.get(key);
    if (!authData) {
      return null;
    }
    if (!Application_default.getCurrentState("authUser")) {
      await this.setUser(authData);
    }
    return Application_default.getCurrentState("authUser");
  }
  sessionKey() {
    return Str.snake(`${Application_default.config.app.name} web-auth-user-id`);
  }
  async formatUserData(user) {
    var _a;
    const RolePermissionModel = (_a = Application_default.config.auth.guards.web) == null ? void 0 : _a.rolePermissionModel;
    let rolePermissions = [];
    if (!(user == null ? void 0 : user.rolePermissions) && RolePermissionModel) {
      const rolePermissionsFromDb = await DB().select().from(RolePermissionModel).where(eq2(RolePermissionModel.user_id, user.id)).all();
      if (rolePermissionsFromDb) {
        for (const item of rolePermissionsFromDb) {
          rolePermissions.push({
            id: item.id,
            role: item.role,
            permissions: item.permissions && typeof item.permissions === "string" ? JSON.parse(item.permissions) : []
          });
        }
      }
    }
    if (user.password) {
      user.password = void 0;
    }
    return {
      ...user,
      rolePermissions,
      hasRole: this.hasRole,
      hasPermission: this.hasPermission
    };
  }
  hasRole(role) {
    const roles = Array.isArray(role) ? role : [role];
    if (Application_default.getCurrentState("authUser")) {
      return Application_default.getCurrentState("authUser").rolePermissions.some(
        (item) => roles.includes(item.role)
      );
    }
    return false;
  }
  hasPermission(permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    if (Application_default.getCurrentState("authUser")) {
      return Application_default.getCurrentState("authUser").rolePermissions.some(
        (item) => permissions.every((perm) => item.permissions.includes(perm))
      );
    }
    return false;
  }
  async setUser(data) {
    const userModel = Application_default.config.auth.guards[data.guard].userModel;
    const user = await DB().select().from(userModel).where(eq2(userModel.id, data.userId)).get();
    if (user) {
      const userData = await this.formatUserData({
        id: user.id,
        name: user.name,
        email: user.email,
        ...user
      });
      Application_default.addToCurrentState("authUser", userData);
    }
  }
};
var Auth = new AuthManager();
var Auth_default = Auth;

// src/middlewares/SessionAuth.ts
var SessionAuth = class extends BaseMiddleware_default {
  constructor() {
    super(...arguments);
    this.redirectPath = "/login";
    this.guard = null;
  }
  setGuard(guard) {
    if (guard) {
      this.guard = guard;
    }
  }
  async boot(context, next) {
    var _a;
    const currentGuard = (_a = this.guard) != null ? _a : Application_default.config.auth.defaultGuard;
    const jwtConfig = Application_default.config.auth.guards[currentGuard];
    if (jwtConfig.driver !== "session") {
      throw new HTTPException3(500, { message: "Invalid session guard" });
    }
    if (!Auth_default.check(currentGuard)) {
      return context.redirect(this.redirectPath, 302);
    }
    return await next();
  }
};
var SessionAuth_default = SessionAuth;

// src/core/request/index.ts
var environmentVars = {};
var RequestData = class {
  constructor(request) {
    this.requestData = {};
    this.headers = {};
    this.request = request;
    this.init(request).then((r) => "done");
  }
  async init(request) {
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const contentType = request.headers.get("content-type");
      if (contentType == null ? void 0 : contentType.includes("application/json")) {
        this.requestData = await request.json();
      } else if ((contentType == null ? void 0 : contentType.includes("application/x-www-form-urlencoded")) || (contentType == null ? void 0 : contentType.includes("multipart/form-data"))) {
        const formData = await request.formData();
        this.requestData = Object.fromEntries(formData.entries());
      }
    }
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    this.requestData = { ...queryParams, ...this.requestData };
    this.headers = {};
    request.headers.forEach((value, key) => {
      this.headers[key.toLowerCase()] = value;
    });
  }
  all() {
    return this.requestData;
  }
  setContext(context) {
    this.context = context;
  }
  getContext() {
    return this.context;
  }
  input(key, defaultValue = null) {
    var _a;
    return (_a = this.requestData[key]) != null ? _a : defaultValue;
  }
  get(key, defaultValue = null) {
    var _a;
    return (_a = this.requestData[key]) != null ? _a : defaultValue;
  }
  getRequest() {
    return this.request;
  }
  header(key, defaultValue = "") {
    var _a;
    return (_a = this.headers[key.toLowerCase()]) != null ? _a : defaultValue;
  }
  allHeaders() {
    return this.headers;
  }
  isMethod(method) {
    return this.request.method.toLowerCase() === method.toLowerCase();
  }
  ip() {
    var _a;
    return ((_a = this.header("x-forwarded-for")) == null ? void 0 : _a.split(",")[0]) || this.header("x-real-ip") || "127.0.0.1";
  }
};
var Request;
function setEnv(env) {
  environmentVars = env;
}
function getEnv(key, defaultValue = "") {
  var _a;
  return (_a = environmentVars[key]) != null ? _a : defaultValue;
}
function setRequest(request) {
  Request = new RequestData(request);
}

// src/core/Application.ts
var middlewareInstances = /* @__PURE__ */ new Map();
var Application = class {
  constructor() {
    this.currentStates = {};
    this.apiPrefix = "api";
    this.hono = new Hono();
  }
  async boot(config) {
    this.config = config;
    if (Object.keys(this.config.app).length === 0) {
      throw new Error("App Configuration not set");
    }
    if (Object.keys(this.config.session).length === 0) {
      throw new Error("Session Configuration not set");
    }
    this.basicInit();
    this.activeGlobalMiddleware();
    this.activeApiMiddleware();
    this.activeWebMiddleware();
    await this.initiateHonoRoute();
    this.activeReactRouterMiddleware();
    this.activePoweredByMiddleware();
  }
  loadConfig(config) {
    this.config = config;
  }
  addToCurrentState(key, value) {
    this.currentStates[key] = value;
  }
  getCurrentState(key) {
    var _a;
    return (_a = this.currentStates[key]) != null ? _a : "";
  }
  basicInit() {
    this.currentStates = {};
    this.hono.use("*", async (context, next) => {
      Request.setContext(context);
      this.currentStates = {};
      await next();
    });
  }
  setEnv(env) {
    setEnv(env);
  }
  setRequest(request) {
    setRequest(request);
  }
  applyRoutes(prefix = null) {
    var _a;
    for (const route of Route_default.getRoutes()) {
      const { method, path, handler, middlewares } = route;
      let finalPath = path;
      if (prefix) {
        finalPath = `${prefix}/${finalPath}`;
      }
      if (finalPath.length > 1) {
        finalPath = finalPath.replace(/\/+/g, "/").replace(/\/$/, "");
      }
      for (let alias of middlewares) {
        let guard = null;
        if (/sessionAuth|jwtAuth/.test(alias)) {
          let parts = alias.split(":");
          alias = parts[0];
          guard = (_a = parts[1]) != null ? _a : null;
        }
        const middleware = this.config.middlewares.aliases[alias];
        if (!middlewareInstances.has(middleware)) {
          middlewareInstances.set(middleware, new middleware());
        }
        const middlewareInstance = middlewareInstances.get(middleware);
        if (middlewareInstance) {
          if (guard && (middlewareInstance instanceof JwtAuth_default || middlewareInstance instanceof SessionAuth_default)) {
            middlewareInstance.setGuard(guard);
          }
          this.hono.use(
            finalPath,
            middlewareInstance.boot.bind(middlewareInstance)
          );
        }
      }
      this.hono[method](finalPath, handler);
    }
  }
  async initiateHonoRoute() {
    await this.config.app.webRoute();
    this.applyRoutes();
    Route_default.reset();
    await this.config.app.apiRoute();
    this.applyRoutes(this.apiPrefix);
  }
  activePoweredByMiddleware() {
    this.hono.use(async (context, next) => {
      await next();
      context.res.headers.set(
        "X-Powered-By",
        "FlyingWorker Framework for Cloudflare Worker/Page with Hono, Remix"
      );
    });
  }
  activeGlobalMiddleware() {
    for (const middleware of this.config.middlewares.global) {
      const middlewareInstance = new middleware();
      this.hono.use(middlewareInstance.boot.bind(middlewareInstance));
    }
  }
  activeWebMiddleware() {
    for (const middleware of this.config.middlewares.web) {
      const middlewareInstance = new middleware();
      this.hono.use(middlewareInstance.boot.bind(middlewareInstance));
    }
  }
  activeReactRouterMiddleware() {
    for (const middleware of this.config.middlewares.reactRouter) {
      const middlewareInstance = new middleware();
      this.hono.use(middlewareInstance.boot.bind(middlewareInstance));
    }
  }
  activeApiMiddleware() {
    for (const middleware of this.config.middlewares.api) {
      const middlewareInstance = new middleware();
      this.hono.use("api/*", middlewareInstance.boot.bind(middlewareInstance));
    }
  }
};
var App = new Application();
var Application_default = App;

// src/middlewares/Cors.ts
var Cors = class extends BaseMiddleware_default {
  async boot(context, next) {
    return cors({
      origin: Application_default.config.cors.origin,
      allowHeaders: Application_default.config.cors.allowHeaders,
      allowMethods: Application_default.config.cors.allowMethods,
      exposeHeaders: Application_default.config.cors.exposeHeaders,
      maxAge: Application_default.config.cors.maxAge,
      credentials: Application_default.config.cors.credentials
    })(context, next);
  }
};

export {
  Cors,
  parseLifetime,
  Cookie,
  passwordHash,
  passwordVerify,
  encrypt,
  decrypt,
  csrfToken,
  CsrfToken,
  JwtAuth_default,
  MaintenanceMode_default,
  ReactRouterMiddlewareApply_default,
  Session,
  DB,
  Session2,
  Auth_default,
  SessionAuth_default,
  Request,
  setEnv,
  getEnv,
  Application_default,
  ApiAuth_default
};
