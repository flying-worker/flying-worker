import { relations } from "drizzle-orm";
import { rolePermissions } from "./rolePermissions";
import { tokens } from "./tokens";
import { users } from "./users";

// Re-export all tables + row types (barrel).
export * from "./users";
export * from "./rolePermissions";
export * from "./tokens";

// --- Relations (enable the typed relational query API: DB().query.users.*) ---

export const usersRelations = relations(users, ({ many }) => ({
	rolePermissions: many(rolePermissions),
	tokens: many(tokens),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
	user: one(users, {
		fields: [rolePermissions.user_id],
		references: [users.id],
	}),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
	user: one(users, {
		fields: [tokens.user_id],
		references: [users.id],
	}),
}));