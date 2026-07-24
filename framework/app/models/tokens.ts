import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * API access tokens (JWT guard).
 *
 * Table name matches the `tokenTable` referenced by the JWT guards.
 * `permissions` is stored as a JSON array of ability strings.
 */
export const tokens = sqliteTable("user_access_token", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	user_id: integer("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name"),
	token: text("token").notNull().unique(),
	permissions: text("permissions", { mode: "json" }).$type<string[]>(),
	expires_at: text("expires_at"),
});

export type TokenRow = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
