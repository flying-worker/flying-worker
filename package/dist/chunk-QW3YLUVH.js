import {
  z
} from "./chunk-LDHSCDN4.js";

// src/zod-schema/index.ts
var RolePermissionSchema = z.object({
  id: z.number(),
  role: z.string(),
  permissions: z.array(z.string())
});
var AuthUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  rolePermissions: RolePermissionSchema.nullish()
  // Optional or null
});
var JwtTokenPayloadSchema = z.object({
  name: z.string().optional(),
  user: AuthUserSchema,
  permissions: z.array(z.string()).optional(),
  maxAge: z.union([
    z.number().nonnegative(),
    z.string().regex(
      /^\d+[smhd]$/,
      "String must follow the format '1s', '2m', '3h', or '4d'"
    )
  ])
}).catchall(z.unknown());

export {
  AuthUserSchema,
  JwtTokenPayloadSchema
};
