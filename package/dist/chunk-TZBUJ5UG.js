// src/zod-schema/jwt-guard.ts
import { z } from "zod";
var UseCookieSchema = z.object({
  status: z.boolean(),
  maxAge: z.union([z.string(), z.number()]),
  key: z.string()
});
var UserModelConstraintSchema = z.object({
  id: z.any(),
  email: z.any(),
  provider_name: z.any(),
  provider_id: z.any(),
  avatar: z.any(),
  remember_token: z.any()
});
var RolePermissionModelConstraintSchema = z.object({
  id: z.any(),
  user_id: z.any(),
  role: z.any(),
  permissions: z.any()
});
var TokenModelConstraintSchema = z.object({
  id: z.any(),
  user_id: z.any(),
  name: z.any(),
  token: z.any(),
  permissions: z.any(),
  expires_at: z.any()
});
var JwtGuardConfigSchema = z.object({
  driver: z.literal("jwt"),
  useCookie: UseCookieSchema,
  userModel: UserModelConstraintSchema,
  rolePermissionModel: RolePermissionModelConstraintSchema.optional(),
  tokenModel: TokenModelConstraintSchema.optional()
});

export {
  JwtGuardConfigSchema
};
