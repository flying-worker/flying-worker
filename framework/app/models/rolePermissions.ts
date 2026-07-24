import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Role / permission assignments per user.
 *
 * Table name matches the `rolePermissionTable` referenced by the auth guards.
 * `permissions` is stored as a JSON array of permission strings.
 */
export const rolePermissions = sqliteTable("role_permissions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	user_id: integer("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	permissions: text("permissions", { mode: "json" })
		.$type<string[]>()
		.notNull()
		.default([]),
});

export type RolePermissionRow = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
